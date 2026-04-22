/**
 * Owner auth — requireOwner()
 * Checks that the authenticated user has owner role or matches OWNER_USER_ID.
 * Throws NextResponse on failure (caught by owner route handlers).
 */

import { NextResponse } from "next/server";
import { requireAuth, type ServerAuthUser } from "./server";

const OWNER_USER_ID = process.env.OWNER_USER_ID;

interface OwnerContext {
  owner: ServerAuthUser;
  ipAddress: string;
  userAgent: string;
}

export type { OwnerContext };

export async function requireLeaderOrAbove(request?: any): Promise<OwnerContext> {
  const user = await requireAuth();

  if (!user) {
    throw NextResponse.json(
      { error: "unauthorized" },
      { status: 401 }
    );
  }

  const isAllowed =
    user.role === "owner" ||
    user.role === "leader" ||
    (OWNER_USER_ID ? user.id === OWNER_USER_ID : false);

  if (!isAllowed) {
    throw NextResponse.json(
      { error: "forbidden", message: "Leader or owner access required" },
      { status: 403 }
    );
  }

  let ipAddress = "unknown";
  let userAgent = "unknown";

  if (request?.headers) {
    if (typeof request.headers.get === "function") {
      ipAddress = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
      userAgent = request.headers.get("user-agent") || "unknown";
    }
  }

  return { owner: user, ipAddress, userAgent };
}

export async function requireOwner(request?: any): Promise<OwnerContext> {
  const user = await requireAuth();

  if (!user) {
    throw NextResponse.json(
      { error: "unauthorized" },
      { status: 401 }
    );
  }

  const isOwner =
    user.role === "owner" ||
    (OWNER_USER_ID ? user.id === OWNER_USER_ID : false);

  if (!isOwner) {
    throw NextResponse.json(
      { error: "forbidden", message: "Owner access required" },
      { status: 403 }
    );
  }

  // Extract IP and user-agent from request if available
  let ipAddress = "unknown";
  let userAgent = "unknown";

  if (request?.headers) {
    if (typeof request.headers.get === "function") {
      ipAddress = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
      userAgent = request.headers.get("user-agent") || "unknown";
    }
  }

  return { owner: user, ipAddress, userAgent };
}
