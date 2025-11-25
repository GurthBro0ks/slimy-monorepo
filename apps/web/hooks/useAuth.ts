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
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          setRole(data.role);
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
          setUser(null);
          setRole(null);
        }
      } catch (err) {
        console.error("Auth check failed:", err);
        setError(err instanceof Error ? err : new Error("Auth check failed"));
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

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
