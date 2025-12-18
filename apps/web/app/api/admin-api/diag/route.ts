import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { apiClient } from "@/lib/api-client";

export const dynamic = "force-dynamic";

export async function GET() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  const result = await apiClient.get("/api/diag", {
    useCache: false,
    headers: {
      Cookie: cookieHeader,
    },
  });

  if (!result.ok) {
    return NextResponse.json(result, { status: result.status || 503 });
  }

  const requestId = result.headers?.get("x-request-id") || null;
  return NextResponse.json(result.data, {
    headers: requestId ? { "x-request-id": requestId } : undefined,
  });
}

