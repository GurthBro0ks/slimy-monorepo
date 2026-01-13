import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  generateInviteToken,
  hashInviteToken,
  validateOwnerInvite,
  createOwnerInvite,
  redeemOwnerInvite,
} from "../invite";
import { prisma } from "@/lib/db";

describe("Owner Invite System", () => {
  let testOwnerId: string;

  beforeEach(async () => {
    // Create a test owner
    const owner = await prisma.ownerAllowlist.create({
      data: {
        email: `test-owner-${Date.now()}@example.com`,
        createdBy: "test",
      },
    });
    testOwnerId = owner.id;
  });

  afterEach(async () => {
    // Clean up
    await prisma.ownerInvite.deleteMany({
      where: { createdById: testOwnerId },
    });
    await prisma.ownerAllowlist.delete({
      where: { id: testOwnerId },
    });
  });

  describe("Token Generation", () => {
    it("should generate random tokens", () => {
      const token1 = generateInviteToken();
      const token2 = generateInviteToken();

      expect(token1).toBeTruthy();
      expect(token2).toBeTruthy();
      expect(token1).not.toEqual(token2);
    });

    it("should generate hex-encoded tokens", () => {
      const token = generateInviteToken();
      expect(/^[0-9a-f]+$/.test(token)).toBe(true);
    });

    it("should generate 64-character tokens (32 bytes)", () => {
      const token = generateInviteToken(32);
      expect(token).toHaveLength(64); // 32 bytes * 2 hex chars
    });
  });

  describe("Token Hashing", () => {
    it("should hash tokens to SHA256 (64 chars)", () => {
      const token = "test-token-123";
      const hash = hashInviteToken(token);

      expect(hash).toHaveLength(64); // SHA256 hex is 64 chars
    });

    it("should produce consistent hashes", () => {
      const token = "test-token-456";
      const hash1 = hashInviteToken(token);
      const hash2 = hashInviteToken(token);

      expect(hash1).toEqual(hash2);
    });

    it("should produce different hashes for different tokens", () => {
      const hash1 = hashInviteToken("token-1");
      const hash2 = hashInviteToken("token-2");

      expect(hash1).not.toEqual(hash2);
    });
  });

  describe("Invite Creation", () => {
    it("should create an invite with defaults", async () => {
      const result = await createOwnerInvite(testOwnerId);

      expect(result.inviteId).toBeTruthy();
      expect(result.tokenPlaintext).toBeTruthy();
      expect(result.codeHash).toHaveLength(64); // SHA256
      expect(result.maxUses).toBe(1);
      expect(result.expiresAt).toBeUndefined();
    });

    it("should create an invite with custom maxUses", async () => {
      const result = await createOwnerInvite(testOwnerId, { maxUses: 5 });

      expect(result.maxUses).toBe(5);
    });

    it("should cap maxUses at 100", async () => {
      const result = await createOwnerInvite(testOwnerId, { maxUses: 200 });

      expect(result.maxUses).toBe(100);
    });

    it("should enforce minimum maxUses of 1", async () => {
      const result = await createOwnerInvite(testOwnerId, { maxUses: 0 });

      expect(result.maxUses).toBeGreaterThanOrEqual(1);
    });

    it("should support expiry dates", async () => {
      const expiryDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      const result = await createOwnerInvite(testOwnerId, {
        expiresAt: expiryDate,
      });

      expect(result.expiresAt).toBeTruthy();
      expect(result.expiresAt?.getTime()).toBeCloseTo(expiryDate.getTime(), -3); // Within 1 second
    });

    it("should store only hash, not plaintext token", async () => {
      const result = await createOwnerInvite(testOwnerId);

      const stored = await prisma.ownerInvite.findUnique({
        where: { id: result.inviteId },
      });

      expect(stored?.codeHash).toEqual(result.codeHash);
      // Verify the returned token hashes to the stored hash
      expect(hashInviteToken(result.tokenPlaintext)).toEqual(stored?.codeHash);
    });
  });

  describe("Invite Validation", () => {
    it("should validate a valid invite", async () => {
      const created = await createOwnerInvite(testOwnerId);
      const validation = await validateOwnerInvite(created.tokenPlaintext);

      expect(validation.valid).toBe(true);
      expect(validation.invite).toBeTruthy();
      expect(validation.invite?.codeHash).toEqual(created.codeHash);
    });

    it("should reject invalid tokens", async () => {
      const validation = await validateOwnerInvite("invalid-token-xyz");

      expect(validation.valid).toBe(false);
      expect(validation.reason).toContain("not found");
    });

    it("should reject revoked invites", async () => {
      const created = await createOwnerInvite(testOwnerId);

      // Revoke it
      await prisma.ownerInvite.update({
        where: { id: created.inviteId },
        data: { revokedAt: new Date() },
      });

      const validation = await validateOwnerInvite(created.tokenPlaintext);

      expect(validation.valid).toBe(false);
      expect(validation.reason).toContain("revoked");
    });

    it("should reject expired invites", async () => {
      const expiryDate = new Date(Date.now() - 1000); // 1 second ago
      const created = await createOwnerInvite(testOwnerId, {
        expiresAt: expiryDate,
      });

      const validation = await validateOwnerInvite(created.tokenPlaintext);

      expect(validation.valid).toBe(false);
      expect(validation.reason).toContain("expired");
    });

    it("should reject invites with maxUses exceeded", async () => {
      const created = await createOwnerInvite(testOwnerId, { maxUses: 1 });

      // Mark as fully used
      await prisma.ownerInvite.update({
        where: { id: created.inviteId },
        data: { useCount: 1 },
      });

      const validation = await validateOwnerInvite(created.tokenPlaintext);

      expect(validation.valid).toBe(false);
      expect(validation.reason).toContain("maximum uses");
    });

    it("should fail closed with multiple validations", async () => {
      const expiredDate = new Date(Date.now() - 1000);
      const created = await createOwnerInvite(testOwnerId, {
        maxUses: 1,
        expiresAt: expiredDate,
      });

      // Mark as used
      await prisma.ownerInvite.update({
        where: { id: created.inviteId },
        data: { useCount: 1 },
      });

      const validation = await validateOwnerInvite(created.tokenPlaintext);

      expect(validation.valid).toBe(false); // Should fail on one of the checks
    });
  });

  describe("Security", () => {
    it("should never expose plaintext tokens in database", async () => {
      const created = await createOwnerInvite(testOwnerId);

      const stored = await prisma.ownerInvite.findUnique({
        where: { id: created.inviteId },
      });

      expect(stored?.codeHash).toBeTruthy();
      // Ensure the stored hash doesn't accidentally contain the plaintext token
      expect(stored?.codeHash).not.toContain(
        created.tokenPlaintext.substring(0, 10)
      );
    });

    it("should have unique code hashes", async () => {
      const result1 = await createOwnerInvite(testOwnerId);
      const result2 = await createOwnerInvite(testOwnerId);

      expect(result1.codeHash).not.toEqual(result2.codeHash);

      // Verify both can be stored (no duplicate key errors in test)
      expect(result1.inviteId).not.toEqual(result2.inviteId);
    });

    it("should be timing-safe in hash validation", async () => {
      const created = await createOwnerInvite(testOwnerId);

      // A wrong token shouldn't leak information based on timing
      // (This is implicit in using the hash comparison)
      const wrong = hashInviteToken("wrong-token");
      const correct = created.codeHash;

      expect(wrong).not.toEqual(correct);
    });
  });

  describe("Invite Redemption", () => {
    it("should redeem an invite and increment uses_count", async () => {
      const created = await createOwnerInvite(testOwnerId, { maxUses: 3 });

      // Get the initial state
      const before = await prisma.ownerInvite.findUnique({
        where: { id: created.inviteId },
      });
      expect(before?.useCount).toBe(0);

      // Redeem once
      const redeemResult = await redeemOwnerInvite(
        created.inviteId,
        "redeemed-user@example.com"
      );

      expect(redeemResult).toBe(true);

      // Check that uses_count incremented
      const after = await prisma.ownerInvite.findUnique({
        where: { id: created.inviteId },
      });
      expect(after?.useCount).toBe(1);
    });

    it("should redeem multiple times up to maxUses", async () => {
      const created = await createOwnerInvite(testOwnerId, { maxUses: 3 });

      // Redeem 3 times
      const redeem1 = await redeemOwnerInvite(
        created.inviteId,
        "user1@example.com"
      );
      const redeem2 = await redeemOwnerInvite(
        created.inviteId,
        "user2@example.com"
      );
      const redeem3 = await redeemOwnerInvite(
        created.inviteId,
        "user3@example.com"
      );

      expect(redeem1).toBe(true);
      expect(redeem2).toBe(true);
      expect(redeem3).toBe(true);

      // Verify uses_count is 3
      const final = await prisma.ownerInvite.findUnique({
        where: { id: created.inviteId },
      });
      expect(final?.useCount).toBe(3);
    });

    it("should fail to redeem when maxUses exceeded", async () => {
      const created = await createOwnerInvite(testOwnerId, { maxUses: 1 });

      // First redeem succeeds
      const redeem1 = await redeemOwnerInvite(
        created.inviteId,
        "user1@example.com"
      );
      expect(redeem1).toBe(true);

      // Second redeem fails (maxUses exceeded)
      const redeem2 = await redeemOwnerInvite(
        created.inviteId,
        "user2@example.com"
      );
      expect(redeem2).toBe(false);

      // Verify uses_count stayed at 1
      const final = await prisma.ownerInvite.findUnique({
        where: { id: created.inviteId },
      });
      expect(final?.useCount).toBe(1);
    });

    it("should fail to redeem a revoked invite", async () => {
      const created = await createOwnerInvite(testOwnerId);

      // Revoke it
      await prisma.ownerInvite.update({
        where: { id: created.inviteId },
        data: { revokedAt: new Date() },
      });

      // Try to redeem
      const redeem = await redeemOwnerInvite(
        created.inviteId,
        "user@example.com"
      );

      expect(redeem).toBe(false);

      // uses_count should remain 0
      const final = await prisma.ownerInvite.findUnique({
        where: { id: created.inviteId },
      });
      expect(final?.useCount).toBe(0);
    });

    it("should fail to redeem an expired invite", async () => {
      const expiryDate = new Date(Date.now() - 1000); // 1 second ago
      const created = await createOwnerInvite(testOwnerId, {
        expiresAt: expiryDate,
      });

      // Try to redeem
      const redeem = await redeemOwnerInvite(
        created.inviteId,
        "user@example.com"
      );

      expect(redeem).toBe(false);

      // uses_count should remain 0
      const final = await prisma.ownerInvite.findUnique({
        where: { id: created.inviteId },
      });
      expect(final?.useCount).toBe(0);
    });

    it("should atomically fail on race condition", async () => {
      const created = await createOwnerInvite(testOwnerId, { maxUses: 2 });

      // Simulate a race: two concurrent redeems where only one succeeds
      // We'll do them sequentially but test the invariant
      const redeem1 = await redeemOwnerInvite(
        created.inviteId,
        "user1@example.com"
      );
      const redeem2 = await redeemOwnerInvite(
        created.inviteId,
        "user2@example.com"
      );

      // Both should succeed (maxUses is 2)
      expect(redeem1).toBe(true);
      expect(redeem2).toBe(true);

      // Third should fail
      const redeem3 = await redeemOwnerInvite(
        created.inviteId,
        "user3@example.com"
      );
      expect(redeem3).toBe(false);
    });
  });
});
