import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { apiClient } from "@/lib/api-client";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();

    const result = await apiClient.get<{ guilds: any[] }>("/api/discord/guilds", {
      useCache: false,
      headers: {
        Cookie: cookieHeader,
      },
    });

    if (!result.ok) {
      return NextResponse.json(result, { status: result.status || 401 });
    }

    return NextResponse.json(result.data);
    
  } catch (error) {
    console.error("[Guilds API] Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
