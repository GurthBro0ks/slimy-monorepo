import { describe, it, expect, afterEach } from "vitest";
import { isOwnerByEmail, initBootstrapOwners } from "../owner";
import { prisma } from "@/lib/db";

describe("Owner Auth", () => {
  describe("isOwnerByEmail", () => {
    it("should return false for null/undefined emails", () => {
      expect(isOwnerByEmail(null)).toBe(false);
      expect(isOwnerByEmail(undefined)).toBe(false);
    });

    it("should return false when OWNER_EMAIL_ALLOWLIST is not set", () => {
      const original = process.env.OWNER_EMAIL_ALLOWLIST;
      delete process.env.OWNER_EMAIL_ALLOWLIST;

      expect(isOwnerByEmail("admin@example.com")).toBe(false);

      if (original) {
        process.env.OWNER_EMAIL_ALLOWLIST = original;
      }
    });

    it("should match emails in allowlist", () => {
      const original = process.env.OWNER_EMAIL_ALLOWLIST;
      process.env.OWNER_EMAIL_ALLOWLIST = "admin@example.com,owner@test.com";

      expect(isOwnerByEmail("admin@example.com")).toBe(true);
      expect(isOwnerByEmail("owner@test.com")).toBe(true);

      if (original) {
        process.env.OWNER_EMAIL_ALLOWLIST = original;
      } else {
        delete process.env.OWNER_EMAIL_ALLOWLIST;
      }
    });

    it("should be case-insensitive", () => {
      const original = process.env.OWNER_EMAIL_ALLOWLIST;
      process.env.OWNER_EMAIL_ALLOWLIST = "Admin@Example.Com";

      expect(isOwnerByEmail("admin@example.com")).toBe(true);
      expect(isOwnerByEmail("ADMIN@EXAMPLE.COM")).toBe(true);

      if (original) {
        process.env.OWNER_EMAIL_ALLOWLIST = original;
      } else {
        delete process.env.OWNER_EMAIL_ALLOWLIST;
      }
    });

    it("should reject emails not in allowlist", () => {
      const original = process.env.OWNER_EMAIL_ALLOWLIST;
      process.env.OWNER_EMAIL_ALLOWLIST = "admin@example.com";

      expect(isOwnerByEmail("user@example.com")).toBe(false);
      expect(isOwnerByEmail("hacker@evil.com")).toBe(false);

      if (original) {
        process.env.OWNER_EMAIL_ALLOWLIST = original;
      } else {
        delete process.env.OWNER_EMAIL_ALLOWLIST;
      }
    });

    it("should handle whitespace in allowlist", () => {
      const original = process.env.OWNER_EMAIL_ALLOWLIST;
      process.env.OWNER_EMAIL_ALLOWLIST = "  admin@example.com  ,  owner@test.com  ";

      expect(isOwnerByEmail("admin@example.com")).toBe(true);
      expect(isOwnerByEmail("owner@test.com")).toBe(true);

      if (original) {
        process.env.OWNER_EMAIL_ALLOWLIST = original;
      } else {
        delete process.env.OWNER_EMAIL_ALLOWLIST;
      }
    });
  });

  describe("initBootstrapOwners", () => {
    afterEach(async () => {
      // Clean up test data
      const testEmails = ["bootstrap-test-1@example.com", "bootstrap-test-2@example.com"];
      await prisma.ownerAllowlist.deleteMany({
        where: { email: { in: testEmails } },
      });
    });

    it("should return 0 when OWNER_EMAIL_ALLOWLIST is not set", async () => {
      const original = process.env.OWNER_EMAIL_ALLOWLIST;
      delete process.env.OWNER_EMAIL_ALLOWLIST;

      const count = await initBootstrapOwners();

      expect(count).toBe(0);

      if (original) {
        process.env.OWNER_EMAIL_ALLOWLIST = original;
      }
    });

    it("should create owners from OWNER_EMAIL_ALLOWLIST", async () => {
      const original = process.env.OWNER_EMAIL_ALLOWLIST;
      process.env.OWNER_EMAIL_ALLOWLIST = "bootstrap-test-1@example.com,bootstrap-test-2@example.com";

      const count = await initBootstrapOwners();

      expect(count).toBe(2);

      // Verify they were created
      const owner1 = await prisma.ownerAllowlist.findUnique({
        where: { email: "bootstrap-test-1@example.com" },
      });
      const owner2 = await prisma.ownerAllowlist.findUnique({
        where: { email: "bootstrap-test-2@example.com" },
      });

      expect(owner1).toBeTruthy();
      expect(owner2).toBeTruthy();
      expect(owner1?.createdBy).toBe("bootstrap-init");
      expect(owner2?.createdBy).toBe("bootstrap-init");

      if (original) {
        process.env.OWNER_EMAIL_ALLOWLIST = original;
      } else {
        delete process.env.OWNER_EMAIL_ALLOWLIST;
      }
    });

    it("should not create duplicates on subsequent calls", async () => {
      const original = process.env.OWNER_EMAIL_ALLOWLIST;
      process.env.OWNER_EMAIL_ALLOWLIST = "bootstrap-test-1@example.com";

      const count1 = await initBootstrapOwners();
      const count2 = await initBootstrapOwners();

      expect(count1).toBe(1);
      expect(count2).toBe(0); // Already exists

      if (original) {
        process.env.OWNER_EMAIL_ALLOWLIST = original;
      } else {
        delete process.env.OWNER_EMAIL_ALLOWLIST;
      }
    });

    it("should handle comma-separated emails with whitespace", async () => {
      const original = process.env.OWNER_EMAIL_ALLOWLIST;
      process.env.OWNER_EMAIL_ALLOWLIST = "  bootstrap-test-1@example.com  ,  bootstrap-test-2@example.com  ";

      const count = await initBootstrapOwners();

      expect(count).toBe(2);

      if (original) {
        process.env.OWNER_EMAIL_ALLOWLIST = original;
      } else {
        delete process.env.OWNER_EMAIL_ALLOWLIST;
      }
    });

    it("should set note indicating bootstrap initialization", async () => {
      const original = process.env.OWNER_EMAIL_ALLOWLIST;
      process.env.OWNER_EMAIL_ALLOWLIST = "bootstrap-test-1@example.com";

      await initBootstrapOwners();

      const owner = await prisma.ownerAllowlist.findUnique({
        where: { email: "bootstrap-test-1@example.com" },
      });

      expect(owner?.note).toContain("OWNER_EMAIL_ALLOWLIST");

      if (original) {
        process.env.OWNER_EMAIL_ALLOWLIST = original;
      } else {
        delete process.env.OWNER_EMAIL_ALLOWLIST;
      }
    });
  });
});
