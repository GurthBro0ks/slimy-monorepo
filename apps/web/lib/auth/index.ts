// Authentication utilities and types
export * from "./types";
export * from "./context";

// Utility functions
export const authUtils = {
  /**
   * Check if a user has the required role or higher
   */
  hasRequiredRole: (userRole: string, requiredRole: string): boolean => {
    const roleHierarchy: Record<string, number> = {
      user: 0,
      club: 1,
      admin: 2,
    };

    const userLevel = roleHierarchy[userRole] || 0;
    const requiredLevel = roleHierarchy[requiredRole] || 0;

    return userLevel >= requiredLevel;
  },

  /**
   * Get the appropriate dashboard route for a user's role
   */
  getDashboardRoute: (role: string): string => {
    switch (role) {
      case "admin":
        return "/guilds";
      case "club":
        return "/club";
      default:
        return "/snail";
    }
  },

  /**
   * Check if current path requires authentication
   */
  requiresAuth: (pathname: string): boolean => {
    const protectedRoutes = ["/guilds", "/admin", "/club", "/snail/codes"];
    return protectedRoutes.some(route => pathname.startsWith(route));
  },

  /**
   * Check if current path requires a specific role
   */
  getRequiredRole: (pathname: string): string | null => {
    if (pathname.startsWith("/guilds") || pathname.startsWith("/admin")) {
      return "admin";
    }
    if (pathname.startsWith("/club")) {
      return "club";
    }
    return null;
  },
};
