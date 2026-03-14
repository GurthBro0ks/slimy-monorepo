import { NextRequest, NextResponse } from "next/server";
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
 * Enforces owner authorization for API routes
 * Returns 401 if not authenticated, 403 if authenticated but not owner
 */
export async function requireOwner(request: NextRequest): Promise<OwnerContext> {
  // First require authentication - now uses the new token-based auth
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

  // Check if user has owner role in the token
  if (user.role !== "owner") {
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
    user: {
      id: user.id,
      email: user.email,
      globalName: user.username,
    },
    owner: {
      id: user.id,
      email: user.email || "",
      userId: user.id,
    },
    ipAddress: ipAddress?.trim(),
    userAgent: userAgent?.substring(0, 500),
  };
}

export async function requireOwnerOrAdmin(request: NextRequest): Promise<OwnerContext> {
  return requireOwner(request);
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
  // No longer needed - using token-based roles
  return 0;
}
