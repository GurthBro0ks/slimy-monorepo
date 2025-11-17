/**
 * RequireRole Component
 *
 * A component wrapper that conditionally renders children based on the user's role.
 * Uses the same role hierarchy as the backend RBAC system.
 *
 * Role Hierarchy (lowest to highest):
 * - user: Basic authenticated user
 * - mod: Moderator with elevated permissions
 * - admin: Administrator with full access
 *
 * @example
 * ```tsx
 * <RequireRole role="admin">
 *   <AdminDashboard />
 * </RequireRole>
 * ```
 */

"use client";

import React, { ReactNode } from "react";
import { useAuth } from "@/lib/auth/context";

/**
 * Role rank mapping for permission checks
 * Higher numbers = higher privilege
 */
const roleRank: { [key: string]: number } = {
  user: 1,
  mod: 2,
  admin: 3,
};

export type Role = "user" | "mod" | "admin";

export interface RequireRoleProps {
  /**
   * The minimum required role to view the content
   */
  role: Role;

  /**
   * Content to render if user has sufficient permissions
   */
  children: ReactNode;

  /**
   * Optional custom fallback to render if user doesn't have permission
   * Defaults to an access denied message
   */
  fallback?: ReactNode;

  /**
   * Optional custom loading component
   * Defaults to a simple "Loading..." message
   */
  loadingComponent?: ReactNode;
}

/**
 * Component that requires a specific role or higher to render its children
 *
 * @param props - Component props
 * @returns The children if user has access, fallback otherwise
 */
export function RequireRole({
  role,
  children,
  fallback,
  loadingComponent,
}: RequireRoleProps): JSX.Element {
  const { user, loading } = useAuth();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        {loadingComponent || (
          <div className="text-center">
            <div className="animate-pulse text-muted-foreground">
              Loading...
            </div>
          </div>
        )}
      </div>
    );
  }

  // Check if user is authenticated
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        {fallback || (
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold text-foreground">
              Authentication Required
            </h2>
            <p className="text-muted-foreground">
              You must be logged in to view this page.
            </p>
            <a
              href={`${process.env.NEXT_PUBLIC_ADMIN_API_BASE}/api/auth/login`}
              className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Log In
            </a>
          </div>
        )}
      </div>
    );
  }

  // Check if user has sufficient role
  const userRoleRank = roleRank[user.role] || 0;
  const requiredRoleRank = roleRank[role] || 0;

  if (userRoleRank < requiredRoleRank) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        {fallback || (
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold text-foreground">
              Access Denied
            </h2>
            <p className="text-muted-foreground">
              You do not have permission to view this page.
            </p>
            <div className="text-sm text-muted-foreground">
              <p>Your role: <span className="font-medium">{user.role}</span></p>
              <p>Required role: <span className="font-medium">{role}</span></p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // User has sufficient permissions, render children
  return <>{children}</>;
}
