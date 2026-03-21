import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { slimeChatGetUser } from "@/lib/auth/slimechat-client";

const MC_API_URL = process.env.MISSION_CONTROL_URL;
const MC_API_KEY = process.env.MC_API_KEY;

async function isAuthenticated() {
  const cookieStore = await cookies();
  const token = cookieStore.get("slimy_session")?.value;
  if (!token) return false;

  try {
    await slimeChatGetUser(token);
    return true;
  } catch (error) {
    return false;
  }
}

export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const res = await fetch(`${MC_API_URL}/api/missions`, {
      headers: {
        "X-MC-Key": MC_API_KEY!,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Upstream error" }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
