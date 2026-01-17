import { describe, it, expect, afterEach, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth/owner";
import * as serverAuth from "@/lib/auth/server";

/**
 * Test the requireOwner middleware for proper 401/403 handling
 * These are unit tests that mock dependencies and don't require database access
 */
describe("requireOwner Unit Tests (No Database)", () => {
  afterEach(() => {
    // Restore all mocks after each test
    vi.restoreAllMocks();
  });

  describe("401 Unauthenticated", () => {
    it("should return 401 (not 500) when requireAuth returns null", async () => {
      // Mock requireAuth to return null (no session)
      vi.spyOn(serverAuth, "requireAuth").mockResolvedValue(null);

      // Mock a request with no auth
      const mockRequest = new NextRequest(
        new URL("http://localhost:3000/api/owner/me"),
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      // When requireAuth returns null, requireOwner should throw NextResponse with 401
      try {
        await requireOwner(mockRequest);
        // If we get here, the test failed (should have thrown)
        expect.fail("requireOwner should have thrown NextResponse");
      } catch (error) {
        // Verify it's a NextResponse with 401 (not 500)
        expect(error).toBeInstanceOf(NextResponse);
        const response = error as NextResponse;
        expect(response.status).toBe(401);

        // Verify the error message structure
        const body = await response.json();
        expect(body).toHaveProperty("error", "unauthorized");
        expect(body).toHaveProperty("message", "Authentication required");
      }
    });

    it("should NOT return 500 when unauthenticated (regression test)", async () => {
      // This is a regression test for the Phase 9D bug fix
      // Previously, requireOwner would throw 500 when requireAuth returned null
      vi.spyOn(serverAuth, "requireAuth").mockResolvedValue(null);

      const mockRequest = new NextRequest(
        new URL("http://localhost:3000/api/owner/me"),
        { method: "GET" }
      );

      try {
        await requireOwner(mockRequest);
        expect.fail("requireOwner should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(NextResponse);
        const response = error as NextResponse;
        // The bug was returning 500, we must return 401
        expect(response.status).not.toBe(500);
        expect(response.status).toBe(401);
      }
    });
  });
});
