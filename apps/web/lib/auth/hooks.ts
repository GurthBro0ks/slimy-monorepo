/**
 * Authentication Hooks for RBAC
 *
 * This module provides React hooks for role-based access control in
 * client components.
 *
 * Role Hierarchy (lowest to highest):
 * - user: Basic authenticated user
 * - mod: Moderator with elevated permissions
 * - admin: Administrator with full access
 */

"use client";

import { useEffect, useState } from "react";
import { useAuth } from "./context";
import { useRouter } from "next/navigation";

/**
 * Role rank mapping for permission checks
 * Higher numbers = higher privilege
 */
const roleRank: { [key: string]: number } = {
  user: 1,
  mod: 2,
  admin: 3,
};

/**
 * Supported role types
 */
export type Role = "user" | "mod" | "admin";

/**
 * Result of role requirement check
 */
export interface RoleCheckResult {
  /**
   * Whether the user has the required role
   */
  hasAccess: boolean;

  /**
   * Whether the auth check is still loading
   */
  loading: boolean;

  /**
   * User's current role (if authenticated)
   */
  userRole?: string;

  /**
   * The role that was required
   */
  requiredRole: Role;
}

/**
 * Hook to check if the current user has a specific role or higher
 *
 * @param requiredRole - The minimum required role
 * @param options - Optional configuration
 * @returns Role check result with access status and loading state
 *
 * @example
 * ```tsx
 * function AdminPanel() {
 *   const { hasAccess, loading } = useRequireRole("admin");
 *
 *   if (loading) return <div>Loading...</div>;
 *   if (!hasAccess) return <div>Access Denied</div>;
 *
 *   return <div>Admin Panel Content</div>;
 * }
 * ```
 */
export function useRequireRole(
  requiredRole: Role,
  options: {
    /**
     * Whether to redirect to login page if not authenticated
     */
    redirectToLogin?: boolean;
    /**
     * Custom redirect path if access is denied
     */
    redirectPath?: string;
  } = {}
): RoleCheckResult {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [hasCheckedRedirect, setHasCheckedRedirect] = useState(false);

  const userRoleRank = user?.role ? roleRank[user.role] || 0 : 0;
  const requiredRoleRank = roleRank[requiredRole] || 0;
  const hasAccess = !loading && user !== null && userRoleRank >= requiredRoleRank;

  useEffect(() => {
    // Only run redirect check once loading is complete
    if (loading || hasCheckedRedirect) return;

    if (!user && options.redirectToLogin) {
      // User not authenticated and should redirect to login
      const adminApiBase = process.env.NEXT_PUBLIC_ADMIN_API_BASE || "";
      if (adminApiBase) {
        window.location.href = `${adminApiBase}/api/auth/login`;
      }
      setHasCheckedRedirect(true);
    } else if (user && !hasAccess && options.redirectPath) {
      // User authenticated but doesn't have required role
      router.push(options.redirectPath);
      setHasCheckedRedirect(true);
    }
  }, [user, loading, hasAccess, hasCheckedRedirect, options.redirectToLogin, options.redirectPath, router]);

  return {
    hasAccess,
    loading,
    userRole: user?.role,
    requiredRole,
  };
}

/**
 * Helper function to check if a role meets the minimum requirement
 *
 * @param userRole - The user's current role
 * @param requiredRole - The minimum required role
 * @returns true if user role is sufficient, false otherwise
 */
export function hasRole(userRole: string | undefined, requiredRole: Role): boolean {
  if (!userRole) return false;

  const userRank = roleRank[userRole] || 0;
  const requiredRank = roleRank[requiredRole] || 0;

  return userRank >= requiredRank;
}

// Re-export useAuth for convenience
export { useAuth } from "./context";
