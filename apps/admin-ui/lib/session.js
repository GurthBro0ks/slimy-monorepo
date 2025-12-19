"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const SessionContext = createContext({
  user: null,
  csrfToken: null,
  loading: true,
  refresh: async () => {},
  setCsrfToken: () => {},
});

const CSRF_STORAGE_KEY = "slimy_admin_csrf";

function getStoredCsrf() {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(CSRF_STORAGE_KEY) || null;
}

function storeCsrf(token) {
  if (typeof window === "undefined") return;
  if (token) {
    sessionStorage.setItem(CSRF_STORAGE_KEY, token);
  } else {
    sessionStorage.removeItem(CSRF_STORAGE_KEY);
  }
}

function buildReturnTo() {
  if (typeof window === "undefined") return "";
  const { pathname, search, hash } = window.location;
  if (!pathname || pathname.startsWith("/login")) return "";
  const value = `${pathname}${search || ""}${hash || ""}`;
  return value ? `?returnTo=${encodeURIComponent(value)}` : "";
}

function redirectToLogin() {
  if (typeof window === "undefined") return;
  if (window.location.pathname.startsWith("/login")) return;
  const returnTo = buildReturnTo();
  window.location.assign(`/login${returnTo}`);
}

export function SessionProvider({ children }) {
  const [state, setState] = useState({
    user: null,
    csrfToken: null,
    loading: true,
  });

  const adoptCsrfFromHash = useCallback(() => {
    if (typeof window === "undefined") return null;
    const hash = window.location.hash;
    if (hash && hash.startsWith("#csrf=")) {
      const token = decodeURIComponent(hash.slice(6));
      window.location.hash = "";
      storeCsrf(token);
      return token;
    }
    return getStoredCsrf();
  }, []);

  const refresh = useCallback(async () => {
    const fallbackCsrf = adoptCsrfFromHash();

    try {
      const response = await fetch("/api/admin-api/api/auth/me", {
        credentials: "include",
      });

      if (response.status === 401) {
        setState({
          user: null,
          csrfToken: fallbackCsrf || null,
          loading: false,
        });
        redirectToLogin();
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const csrfToken = data.csrfToken || fallbackCsrf || null;
      if (csrfToken) storeCsrf(csrfToken);

      setState({
        user: data,
        csrfToken,
        loading: false,
      });
    } catch {
      setState({
        user: null,
        csrfToken: fallbackCsrf || null,
        loading: false,
      });
    }
  }, [adoptCsrfFromHash]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const setCsrfToken = useCallback((token) => {
    storeCsrf(token);
    setState((prev) => ({ ...prev, csrfToken: token }));
  }, []);

  const value = useMemo(
    () => ({
      user: state.user,
      csrfToken: state.csrfToken,
      loading: state.loading,
      refresh,
      setCsrfToken,
    }),
    [state, refresh, setCsrfToken],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  return useContext(SessionContext);
}
