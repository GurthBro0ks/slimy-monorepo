import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const cookieStore = cookies();
    const user = await requireAuth(cookieStore);

    // CRASH GUARD: Handle null user safely
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Return the guilds already populated in the user object
    return NextResponse.json(user.guilds || []);
    
  } catch (error) {
    console.error("[Guilds API] Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
