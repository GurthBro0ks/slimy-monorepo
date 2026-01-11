// Trader client factory

import type { TraderClient, AdapterType } from "./types";
import { createMockAdapter } from "./adapters/mock";
import { createHttpAdapter } from "./adapters/http";

export function createTraderClient(
  adapterType?: AdapterType,
  apiBase?: string
): TraderClient {
  const type =
    adapterType ||
    (process.env.NEXT_PUBLIC_TRADER_ADAPTER as AdapterType) ||
    "mock";

  switch (type) {
    case "http":
      return createHttpAdapter(apiBase);
    case "mock":
    default:
      return createMockAdapter();
  }
}

export function getAdapterType(): AdapterType {
  return (process.env.NEXT_PUBLIC_TRADER_ADAPTER as AdapterType) || "mock";
}

export function getApiBase(): string {
  return process.env.NEXT_PUBLIC_TRADER_API_BASE || "(mock)";
}
