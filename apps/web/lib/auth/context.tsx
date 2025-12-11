"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { AuthContextType, AuthState } from "./types";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    error: null,
    lastRefresh: 0,
  });

  const refresh = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      const res = await fetch("/api/auth/me", { credentials: "include" });

      if (res.ok) {
        const user = await res.json();
        setState({
          user,
          isLoading: false,
          error: null,
          lastRefresh: Date.now(),
        });
      } else {
        setState({
          user: null,
          isLoading: false,
          error: null,
          lastRefresh: 0,
        });
      }
    } catch (err) {
      console.error("[Auth] Refresh failed:", err);
      setState({
        user: null,
        isLoading: false,
        error: err instanceof Error ? err.message : "Auth check failed",
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

  const logout = async () => {
    try {
      // Call logout endpoint to clear cookies
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.error("Logout failed", err);
    } finally {
      // Clear local state
      setState({
        user: null,
        isLoading: false,
        error: null,
        lastRefresh: 0,
      });
      // Redirect to landing page
      // Force a hard refresh to clear client state
      window.location.href = "/";
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
