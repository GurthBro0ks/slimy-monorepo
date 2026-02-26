import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { slimeChatLogin } from "@/lib/auth/slimechat-client";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ success: false, error: "Email and password are required" }, { status: 400 });
    }

    const result = await slimeChatLogin(email, password);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 401 });
    }

    // On success: set httpOnly cookie "slimy_session"
    const cookieStore = await cookies();
    cookieStore.set("slimy_session", result.token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return NextResponse.json({
      success: true,
      user: { id: result.userId, username: email, displayName: email },
    });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
