"use client";

import { useState, useEffect } from "react";

export interface AuthUser {
  id: string;
  discordId: string;
  username: string;
  globalName?: string;
  avatar?: string;
  role: "admin" | "club" | "member";
  lastActiveGuildId?: string;
}

export interface GuildInfo {
  id: string;
  roles: string[];
}

export interface UseAuthReturn {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AuthUser | null;
  role: string | null;
  guilds: GuildInfo[] | null;
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
  const [guilds, setGuilds] = useState<GuildInfo[] | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          console.log("[useAuth] /api/auth/me response:", data);

          // Handle both nested { user: ... } (Next.js API) and flat user object (Backend Proxy)
          const userData = data.user || data;

          if (userData && userData.id) {
            // Map backend's lastActiveGuild object to lastActiveGuildId if needed
            if (userData.lastActiveGuild && !userData.lastActiveGuildId) {
              userData.lastActiveGuildId = userData.lastActiveGuild.id;
            }

            setUser(userData);
            setRole(userData.role || data.role);
            setGuilds(userData.guilds || data.guilds || []);
            setIsAuthenticated(true);
          } else {
            console.warn("[useAuth] Invalid user data structure:", data);
            setIsAuthenticated(false);
            setUser(null);
          }
        } else {
          console.warn("[useAuth] Auth check failed with status:", res.status);
          setIsAuthenticated(false);
          setUser(null);
          setRole(null);
          setGuilds(null);
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
    guilds,
    error,
  };
}
