import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { apiClient } from "@/lib/api-client";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();

    if (!cookieHeader.trim()) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const result = await apiClient.get<{ guilds: any[] }>("/api/discord/guilds", {
      useCache: false,
      headers: {
        Cookie: cookieHeader,
      },
    });

    if (!result.ok) {
      const status = typeof result.status === "number" ? result.status : 502;

      if (status === 401 || status === 403) {
        return NextResponse.json({ error: "unauthorized" }, { status: 401 });
      }

      if (status >= 500) {
        return NextResponse.json({ error: "upstream_failed" }, { status: 502 });
      }

      return NextResponse.json({ error: "request_failed" }, { status });
    }

    return NextResponse.json(result.data);
    
  } catch (error) {
    console.error("[Guilds API] Error:", (error as any)?.message || error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
