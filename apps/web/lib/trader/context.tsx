"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import type { TraderClient, TraderMode, AdapterType, TraderState } from "./types";
import { createTraderClient, getAdapterType, getApiBase } from "./client";

interface TraderContextValue extends TraderState {
  client: TraderClient;
  refresh: () => void;
  recordFetch: (latencyMs: number, error?: string | null) => void;
}

const TraderContext = createContext<TraderContextValue | null>(null);

interface TraderProviderProps {
  children: ReactNode;
  initialMode?: TraderMode;
}

export function TraderProvider({ children, initialMode }: TraderProviderProps) {
  const [state, setState] = useState<TraderState>(() => ({
    mode: initialMode || "shadow",
    adapterType: getAdapterType(),
    apiBase: getApiBase(),
    lastFetch: null,
    latencyMs: null,
    errorCount: 0,
    lastError: null,
  }));

  const client = useMemo(
    () => createTraderClient(state.adapterType),
    [state.adapterType]
  );

  const recordFetch = useCallback((latencyMs: number, error?: string | null) => {
    setState((prev) => ({
      ...prev,
      lastFetch: new Date().toISOString(),
      latencyMs,
      errorCount: error ? prev.errorCount + 1 : prev.errorCount,
      lastError: error || prev.lastError,
    }));
  }, []);

  const refresh = useCallback(() => {
    // Force re-render of dependent components
    setState((prev) => ({
      ...prev,
      lastFetch: new Date().toISOString(),
    }));
  }, []);

  // Fetch health on mount to initialize state
  useEffect(() => {
    client.getHealth().then((result) => {
      recordFetch(result.latencyMs, result.error);
    });
  }, [client, recordFetch]);

  const value = useMemo<TraderContextValue>(
    () => ({
      ...state,
      client,
      refresh,
      recordFetch,
    }),
    [state, client, refresh, recordFetch]
  );

  return (
    <TraderContext.Provider value={value}>{children}</TraderContext.Provider>
  );
}

export function useTrader(): TraderContextValue {
  const context = useContext(TraderContext);
  if (!context) {
    throw new Error("useTrader must be used within a TraderProvider");
  }
  return context;
}

export function useTraderClient(): TraderClient {
  const { client } = useTrader();
  return client;
}
