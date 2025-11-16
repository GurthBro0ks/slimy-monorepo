"use client";

import { useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/context";
import { Role } from "@/slimy.config";
import { Skeleton } from "@/components/ui/skeleton";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: Role;
  fallback?: ReactNode;
  redirectTo?: string;
  requireAuth?: boolean;
}

/**
 * ProtectedRoute component that handles authentication and role-based access control
 *
 * @param children - The content to render if access is granted
 * @param requiredRole - Minimum role required (optional)
 * @param fallback - Custom fallback component to render when access is denied (optional)
 * @param redirectTo - URL to redirect to when access is denied (optional, defaults to home)
 * @param requireAuth - Whether authentication is required (default: true)
 */
export function ProtectedRoute({
  children,
  requiredRole,
  fallback,
  redirectTo = "/",
  requireAuth = true,
}: ProtectedRouteProps) {
  const { user, loading, error } = useAuth();
  const router = useRouter();

  // Handle redirects with useEffect - always call hooks in same order
  useEffect(() => {
    // Check authentication requirement
    if (!loading && requireAuth && !user) {
      if (error) {
        console.error("Authentication error:", error);
      }

      if (!fallback) {
        if (redirectTo === "/login" || !user) {
          // For login redirects, we need to trigger login flow
          const adminApiBase = process.env.NEXT_PUBLIC_ADMIN_API_BASE || "";
          if (adminApiBase) {
            window.location.href = `${adminApiBase}/api/auth/login`;
          } else {
            router.push("/");
          }
        } else {
          router.push(redirectTo);
        }
      }
    }

    // Check role-based access
    if (!loading && requiredRole && user) {
      const roleHierarchy: Record<Role, number> = {
        user: 0,
        club: 1,
        admin: 2,
      };

      const userRoleLevel = roleHierarchy[user.role] || 0;
      const requiredRoleLevel = roleHierarchy[requiredRole] || 0;

      if (userRoleLevel < requiredRoleLevel && !fallback) {
        router.push(redirectTo);
      }
    }
  }, [loading, user, error, requireAuth, requiredRole, fallback, redirectTo, router]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      fallback || (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="space-y-4 w-full max-w-md">
            <Skeleton className="h-4 w-3/4 mx-auto" />
            <Skeleton className="h-4 w-1/2 mx-auto" />
            <Skeleton className="h-8 w-full" />
          </div>
        </div>
      )
    );
  }

  // Check authentication requirement
  if (requireAuth && !user) {
    // If custom fallback provided, render it
    if (fallback) {
      return <>{fallback}</>;
    }
    return null; // Will redirect via useEffect
  }

  // Check role-based access
  if (requiredRole && user) {
    const roleHierarchy: Record<Role, number> = {
      user: 0,
      club: 1,
      admin: 2,
    };

    const userRoleLevel = roleHierarchy[user.role] || 0;
    const requiredRoleLevel = roleHierarchy[requiredRole] || 0;

    if (userRoleLevel < requiredRoleLevel) {
      // Insufficient role - show fallback or redirect via useEffect
      if (fallback) {
        return <>{fallback}</>;
      }
      return null; // Will redirect via useEffect
    }
  }

  // Access granted - render children
  return <>{children}</>;
}

/**
 * Higher-order component for protecting entire pages
 */
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options: Omit<ProtectedRouteProps, "children"> = {}
) {
  return function AuthenticatedComponent(props: P) {
    return (
      <ProtectedRoute {...options}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}
