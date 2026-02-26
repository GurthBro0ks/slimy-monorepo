import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { slimeChatLogout } from "@/lib/auth/slimechat-client";

export const dynamic = "force-dynamic";

export async function POST() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("slimy_session")?.value;

  if (sessionToken) {
    await slimeChatLogout(sessionToken);
    cookieStore.delete("slimy_session");
  }

  return NextResponse.json({ success: true });
}
