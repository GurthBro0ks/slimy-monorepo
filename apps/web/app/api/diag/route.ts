import { NextResponse } from "next/server";
import { apiClient } from "@/lib/api-client";

export const revalidate = 60; // Cache for 60 seconds

export async function GET() {
  const result = await apiClient.get("/api/diag", {
    useCache: true, // Enable caching for diagnostics
    cacheTtl: 60000, // 1 minute TTL
  });

  if (!result.ok) {
    return NextResponse.json(result, { status: result.status || 503 });
  }

  return NextResponse.json(result.data);
}
