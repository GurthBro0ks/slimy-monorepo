import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { logOwnerAction, getOwnerAuditLogs, parseAuditChanges } from "../audit";
import { prisma } from "@/lib/db";

describe("Owner Audit Logging", () => {
  let testOwnerId: string;

  beforeEach(async () => {
    // Create a test owner
    const owner = await prisma.ownerAllowlist.create({
      data: {
        email: `test-audit-${Date.now()}@example.com`,
        createdBy: "test",
      },
    });
    testOwnerId = owner.id;
  });

  afterEach(async () => {
    // Clean up
    await prisma.ownerAuditLog.deleteMany({
      where: { actorId: testOwnerId },
    });
    await prisma.ownerAllowlist.delete({
      where: { id: testOwnerId },
    });
  });

  describe("Logging Actions", () => {
    it("should log owner actions", async () => {
      await logOwnerAction({
        actorId: testOwnerId,
        action: "INVITE_CREATE",
        resourceType: "invite",
        resourceId: "test-invite-id",
      });

      const logs = await getOwnerAuditLogs();
      const lastLog = logs[0];

      expect(lastLog.action).toBe("INVITE_CREATE");
      expect(lastLog.resourceType).toBe("invite");
      expect(lastLog.resourceId).toBe("test-invite-id");
    });

    it("should store changes as JSON", async () => {
      const changes = {
        maxUses: 5,
        note: "Test invite",
      };

      await logOwnerAction({
        actorId: testOwnerId,
        action: "INVITE_CREATE",
        resourceType: "invite",
        changes,
      });

      const logs = await getOwnerAuditLogs();
      const lastLog = logs[0];
      const parsed = parseAuditChanges(lastLog.changes || null);

      expect(parsed).toEqual(changes);
    });

    it("should include IP address and user agent", async () => {
      await logOwnerAction({
        actorId: testOwnerId,
        action: "INVITE_CREATE",
        resourceType: "invite",
        ipAddress: "192.168.1.1",
        userAgent: "Mozilla/5.0...",
      });

      const logs = await getOwnerAuditLogs();
      const lastLog = logs[0];

      expect(lastLog.ipAddress).toBe("192.168.1.1");
      expect(lastLog.userAgent).toBe("Mozilla/5.0...");
    });

    it("should cap IP address length", async () => {
      const longIp = "1".repeat(100); // IP should max at 45

      await logOwnerAction({
        actorId: testOwnerId,
        action: "INVITE_CREATE",
        resourceType: "invite",
        ipAddress: longIp,
      });

      const logs = await getOwnerAuditLogs();
      const lastLog = logs[0];

      expect(lastLog.ipAddress?.length).toBeLessThanOrEqual(45);
    });

    it("should cap user agent length", async () => {
      const longAgent = "x".repeat(1000); // Should cap at 500

      await logOwnerAction({
        actorId: testOwnerId,
        action: "INVITE_CREATE",
        resourceType: "invite",
        userAgent: longAgent,
      });

      const logs = await getOwnerAuditLogs();
      const lastLog = logs[0];

      expect(lastLog.userAgent?.length).toBeLessThanOrEqual(500);
    });
  });

  describe("Sanitization", () => {
    it("should remove plaintext tokens from audit logs", async () => {
      const changes = {
        token: "secret-plaintext-token",
        maxUses: 5,
      };

      await logOwnerAction({
        actorId: testOwnerId,
        action: "INVITE_CREATE",
        resourceType: "invite",
        changes,
      });

      const logs = await getOwnerAuditLogs();
      const parsed = parseAuditChanges(logs[0].changes || null);

      expect(parsed?.token).toBeUndefined();
      expect(parsed?.maxUses).toBe(5);
    });

    it("should remove tokenPlaintext field", async () => {
      const changes = {
        tokenPlaintext: "secret-token-123",
        inviteId: "test-id",
      };

      await logOwnerAction({
        actorId: testOwnerId,
        action: "INVITE_CREATE",
        resourceType: "invite",
        changes,
      });

      const logs = await getOwnerAuditLogs();
      const parsed = parseAuditChanges(logs[0].changes || null);

      expect(parsed?.tokenPlaintext).toBeUndefined();
      expect(parsed?.inviteId).toBe("test-id");
    });

    it("should remove password fields", async () => {
      const changes = {
        password: "secret-password-123",
        email: "test@example.com",
      };

      await logOwnerAction({
        actorId: testOwnerId,
        action: "SETTINGS_UPDATE",
        resourceType: "settings",
        changes,
      });

      const logs = await getOwnerAuditLogs();
      const parsed = parseAuditChanges(logs[0].changes || null);

      expect(parsed?.password).toBeUndefined();
      expect(parsed?.email).toBe("test@example.com");
    });

    it("should obscure code hashes", async () => {
      const changes = {
        codeHash: "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
      };

      await logOwnerAction({
        actorId: testOwnerId,
        action: "INVITE_CREATE",
        resourceType: "invite",
        changes,
      });

      const logs = await getOwnerAuditLogs();
      const parsed = parseAuditChanges(logs[0].changes || null);

      expect(parsed?.codeHash).toBe("[64-char-hash]");
    });

    it("should preserve non-sensitive data", async () => {
      const changes = {
        maxUses: 10,
        expiresAt: "2025-12-31",
        note: "Test invite",
        email: "owner@example.com",
      };

      await logOwnerAction({
        actorId: testOwnerId,
        action: "INVITE_CREATE",
        resourceType: "invite",
        changes,
      });

      const logs = await getOwnerAuditLogs();
      const parsed = parseAuditChanges(logs[0].changes || null);

      expect(parsed?.maxUses).toBe(10);
      expect(parsed?.expiresAt).toBe("2025-12-31");
      expect(parsed?.note).toBe("Test invite");
      expect(parsed?.email).toBe("owner@example.com");
    });
  });

  describe("Querying Logs", () => {
    beforeEach(async () => {
      // Create multiple audit logs
      for (let i = 0; i < 3; i++) {
        await logOwnerAction({
          actorId: testOwnerId,
          action: "INVITE_CREATE",
          resourceType: "invite",
        });
      }

      for (let i = 0; i < 2; i++) {
        await logOwnerAction({
          actorId: testOwnerId,
          action: "SETTINGS_UPDATE",
          resourceType: "settings",
        });
      }
    });

    it("should retrieve audit logs", async () => {
      const logs = await getOwnerAuditLogs(100);

      expect(logs.length).toBeGreaterThanOrEqual(5);
    });

    it("should filter by action", async () => {
      const logs = await getOwnerAuditLogs(100, "INVITE_CREATE");

      expect(logs.every((log) => log.action === "INVITE_CREATE")).toBe(true);
    });

    it("should respect limit", async () => {
      const logs = await getOwnerAuditLogs(2);

      expect(logs.length).toBeLessThanOrEqual(2);
    });

    it("should return logs in descending order (newest first)", async () => {
      const logs = await getOwnerAuditLogs(100);

      for (let i = 0; i < logs.length - 1; i++) {
        expect(logs[i].createdAt.getTime()).toBeGreaterThanOrEqual(
          logs[i + 1].createdAt.getTime()
        );
      }
    });
  });

  describe("JSON Parsing", () => {
    it("should parse valid JSON", () => {
      const json = JSON.stringify({ key: "value", num: 123 });
      const parsed = parseAuditChanges(json);

      expect(parsed).toEqual({ key: "value", num: 123 });
    });

    it("should return null for null input", () => {
      const parsed = parseAuditChanges(null);

      expect(parsed).toBeNull();
    });

    it("should return null for invalid JSON", () => {
      const parsed = parseAuditChanges("not valid json {");

      expect(parsed).toBeNull();
    });

    it("should return null for empty string", () => {
      const parsed = parseAuditChanges("");

      expect(parsed).toBeNull();
    });
  });
});
