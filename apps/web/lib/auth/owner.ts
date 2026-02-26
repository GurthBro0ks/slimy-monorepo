import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "./server";

export interface OwnerContext {
  user: {
    id: string;
    email?: string | null;
    globalName?: string | null;
  };
  owner: {
    id: string;
    email: string;
    userId?: string | null;
  };
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Enforces admin authorization for API routes
 * For now, admin = owner. Can be extended later for separate admin role.
 * Returns 401 if not authenticated, 403 if authenticated but not admin
 */
export async function requireOwnerOrAdmin(request: NextRequest): Promise<OwnerContext> {
  return requireOwner(request);
}

/**
 * Enforces owner authorization for API routes
 * Returns 401 if not authenticated, 403 if authenticated but not owner
 */
export async function requireOwner(request: NextRequest): Promise<OwnerContext> {
  // First require authentication
  const user = await requireAuth();

  // requireAuth() returns null if not authenticated
  if (!user) {
    throw new NextResponse(
      JSON.stringify({
        error: "unauthorized",
        message: "Authentication required",
      }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  // Check if user is in OwnerAllowlist
  const owner = await prisma.ownerAllowlist.findFirst({
    where: {
      OR: [
        // By email if available
        user.email ? { email: user.email } : undefined,
        // By User ID
        { userId: user.id },
      ].filter(Boolean),
      revokedAt: null, // Only active owners
    },
  });

  if (!owner) {
    throw new NextResponse(
      JSON.stringify({
        error: "forbidden",
        message: "Owner access required",
      }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  // Extract IP and user agent for audit logging
  const xForwardedFor = request.headers.get("x-forwarded-for");
  const xRealIp = request.headers.get("x-real-ip");
  const ipAddress = xForwardedFor?.split(",")[0] || xRealIp || undefined;
  const userAgent = request.headers.get("user-agent") || undefined;

  return {
    user,
    owner,
    ipAddress: ipAddress?.trim(),
    userAgent: userAgent?.substring(0, 500), // Cap user agent length
  };
}

/**
 * Check if a user email is an owner (for bootstrap/env-based checks)
 * Used for initial setup before database seeding
 */
export function isOwnerByEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const ownerEmailList = process.env.OWNER_EMAIL_ALLOWLIST || "";
  if (!ownerEmailList) return false;
  const emails = ownerEmailList.split(",").map((e) => e.trim().toLowerCase());
  return emails.includes(email.toLowerCase());
}

/**
 * Initialize a bootstrap owner from environment variable
 * OWNER_EMAIL_ALLOWLIST="admin@example.com,owner@example.com"
 */
export async function initBootstrapOwners(): Promise<number> {
  const ownerEmailList = process.env.OWNER_EMAIL_ALLOWLIST || "";
  if (!ownerEmailList) return 0;

  const emails = ownerEmailList.split(",").map((e) => e.trim().toLowerCase());
  let count = 0;

  for (const email of emails) {
    const existing = await prisma.ownerAllowlist.findUnique({
      where: { email },
    });

    if (!existing) {
      await prisma.ownerAllowlist.create({
        data: {
          email,
          createdBy: "bootstrap-init",
          note: "Initialized from OWNER_EMAIL_ALLOWLIST env var",
        },
      });
      count++;
    }
  }

  return count;
}
