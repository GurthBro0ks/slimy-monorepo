"use client";

import { useState, useEffect } from "react";

export interface AuthUser {
  id: string;
  discordId: string;
  username: string;
  globalName?: string;
  avatar?: string;
  role: "admin" | "club" | "member";
}

export interface UseAuthReturn {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AuthUser | null;
  role: string | null;
  error: Error | null;
}

/**
 * Hook to check if user is authenticated by calling /api/auth/me
 * Returns authentication status, user data, and loading state
 */
export function useAuth(): UseAuthReturn {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function checkAuth() {
      try {
        setIsLoading(true);
        const response = await fetch("/api/auth/me", {
          credentials: "include", // Include cookies
        });

        if (response.ok) {
          const data = await response.json();
          setIsAuthenticated(true);
          setUser(data.user || null);
          setRole(data.role || null);
          setError(null);
        } else {
          // 401/403 means not authenticated
          setIsAuthenticated(false);
          setUser(null);
          setRole(null);
          setError(null);
        }
      } catch (err) {
        // Network error or other issue
        setIsAuthenticated(false);
        setUser(null);
        setRole(null);
        setError(err instanceof Error ? err : new Error("Failed to check authentication"));
      } finally {
        setIsLoading(false);
      }
    }

    checkAuth();
  }, []);

  return {
    isAuthenticated,
    isLoading,
    user,
    role,
    error,
  };
}
