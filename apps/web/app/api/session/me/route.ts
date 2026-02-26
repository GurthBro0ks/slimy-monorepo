import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { slimeChatGetUser } from "@/lib/auth/slimechat-client";

export const dynamic = "force-dynamic";

export async function GET() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("slimy_session")?.value;

  if (!sessionToken) {
    return NextResponse.json({ success: false, error: "No session" }, { status: 401 });
  }

  try {
    const stoatUser = await slimeChatGetUser(sessionToken);

    // Determine role:
    const ownerId = process.env.OWNER_USER_ID;
    const role = stoatUser._id === ownerId ? "owner" : "member";

    return NextResponse.json({
      id: stoatUser._id,
      username: stoatUser.username,
      displayName: stoatUser.display_name || stoatUser.username,
      avatar: stoatUser.avatar,
      email: undefined, // Email is not returned by @me typically, but omitted per instructions
      role: role,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Invalid session" }, { status: 401 });
  }
}
