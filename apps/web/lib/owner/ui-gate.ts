"use server";

import { requireOwner } from "@/lib/auth/owner";
import { NextRequest, NextResponse } from "next/server";
import { redirect } from "next/navigation";

export interface OwnerAccessCheck {
  isOwner: boolean;
  isAuthenticated: boolean;
  user?: {
    id: string;
    email?: string | null;
    discordId: string;
    globalName?: string | null;
  };
  owner?: {
    id: string;
    email: string;
    userId?: string | null;
  };
  error?: string;
}

/**
 * Checks owner access from server components
 * Returns false if not authenticated, false if authenticated but not owner
 * Can throw if you want to handle redirects differently
 */
export async function checkOwnerAccessServer(
  request?: NextRequest
): Promise<OwnerAccessCheck> {
  try {
    if (!request) {
      // For server components without request context, we can't check
      // This should rarely happen - use requireOwnerLayout instead
      return {
        isOwner: false,
        isAuthenticated: false,
        error: "no_request_context",
      };
    }

    const ctx = await requireOwner(request);
    return {
      isOwner: true,
      isAuthenticated: true,
      user: ctx.user,
      owner: ctx.owner,
    };
  } catch (error) {
    if (error instanceof NextResponse) {
      const status = error.status;
      if (status === 401) {
        return {
          isOwner: false,
          isAuthenticated: false,
          error: "unauthorized",
        };
      }
      if (status === 403) {
        return {
          isOwner: false,
          isAuthenticated: true,
          error: "forbidden",
        };
      }
    }
    return {
      isOwner: false,
      isAuthenticated: false,
      error: "unknown_error",
    };
  }
}

/**
 * Middleware-style gating helper for layout.tsx
 * Throws redirect() or NextResponse for proper Next.js handling
 */
export async function requireOwnerLayout(request: NextRequest) {
  try {
    const ctx = await requireOwner(request);
    return { success: true, ctx };
  } catch (error) {
    if (error instanceof NextResponse) {
      const status = error.status;
      if (status === 401) {
        redirect("/");
      }
      if (status === 403) {
        // Redirect to 403 forbidden page
        redirect("/owner/forbidden");
      }
    }
    // Unknown error, also redirect
    redirect("/");
  }
}
