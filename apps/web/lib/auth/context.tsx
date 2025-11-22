"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { apiClient } from "@/lib/api-client";
import { AuthContextType, AuthState, AuthUser } from "./types";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
    lastRefresh: 0,
  });

  const refresh = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const response = await apiClient.get<AuthUser>("/auth/me", {
        useCache: false,
      });

      if (response.ok && response.data) {
        setState({
          user: response.data,
          loading: false,
          error: null,
          lastRefresh: Date.now(),
        });
      } else {
        setState({
          user: null,
          loading: false,
          error: "Failed to authenticate",
          lastRefresh: 0,
        });
      }
    } catch (error) {
      console.error("Auth refresh failed:", error);
      setState({
        user: null,
        loading: false,
        error: error instanceof Error ? error.message : "Authentication failed",
        lastRefresh: 0,
      });
    }
  }, []);

  const login = () => {
    const adminApiBase = process.env.NEXT_PUBLIC_ADMIN_API_BASE || "";
    if (adminApiBase) {
      window.location.href = `${adminApiBase}/api/auth/login`;
    } else {
      console.error("NEXT_PUBLIC_ADMIN_API_BASE not configured");
    }
  };

  const logout = () => {
    // Clear local state immediately for better UX
    setState({
      user: null,
      loading: false,
      error: null,
      lastRefresh: 0,
    });

    const adminApiBase = process.env.NEXT_PUBLIC_ADMIN_API_BASE || "";
    if (adminApiBase) {
      // Redirect to admin API logout endpoint
      window.location.href = `${adminApiBase}/api/auth/logout`;
    } else {
      console.error("NEXT_PUBLIC_ADMIN_API_BASE not configured");
    }
  };

  // Automatic token refresh logic
  useEffect(() => {
    if (!state.user || state.lastRefresh === 0) return;

    // Refresh token every 25 minutes if user is logged in
    // This assumes sessions last around 30 minutes on the admin API
    const REFRESH_INTERVAL = 25 * 60 * 1000; // 25 minutes
    const timeSinceLastRefresh = Date.now() - state.lastRefresh;

    const triggerRefresh = () =>
      refresh().catch(error => {
        console.error("[Auth] Auto-refresh failed:", error);
      });

    let immediateTimer: ReturnType<typeof setTimeout> | undefined;

    if (timeSinceLastRefresh >= REFRESH_INTERVAL) {
      console.log("[Auth] Auto-refreshing session...");
      immediateTimer = setTimeout(triggerRefresh, 0);
    }

    // Set up next refresh check
    const nextCheck = REFRESH_INTERVAL - timeSinceLastRefresh;
    const timeoutId = setTimeout(() => {
      if (state.user) {
        console.log("[Auth] Checking if session needs refresh...");
        triggerRefresh();
      }
    }, Math.max(nextCheck, 60000)); // Minimum 1 minute between checks

    return () => {
      if (immediateTimer) clearTimeout(immediateTimer);
      clearTimeout(timeoutId);
    };
  }, [refresh, state.lastRefresh, state.user]);

  // Initial auth check on mount
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      if (mounted) {
        await refresh();
      }
    };

    initAuth();

    return () => {
      mounted = false;
    };
  }, []);

  const value: AuthContextType = {
    ...state,
    login,
    logout,
    refresh,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
