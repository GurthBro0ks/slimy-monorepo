"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { AuthUser, AuthContextType } from "./types";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const checkSession = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/session/me", { cache: "no-store" });
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error("[Auth] Session check failed:", err);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refresh = checkSession; // Alias for backward compatibility

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/session/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        await checkSession();
        return { success: true };
      } else {
        setIsLoading(false);
        return { success: false, error: data.error || "Login failed" };
      }
    } catch (err) {
      setIsLoading(false);
      return { success: false, error: err instanceof Error ? err.message : "An unexpected error occurred" };
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await fetch("/api/session/logout", { method: "POST" });
    } catch (err) {
      console.error("Logout failed", err);
    } finally {
      setUser(null);
      setIsLoading(false);
      window.location.href = "/";
    }
  };

  useEffect(() => {
    let mounted = true;
    const initAuth = async () => {
      if (mounted) {
        await checkSession();
      }
    };
    initAuth();
    return () => {
      mounted = false;
    };
  }, [checkSession]);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    role: user?.role || null,
    login,
    logout,
    checkSession,
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
