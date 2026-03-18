import { NextResponse } from "next/server";
import { cookies } from "next/headers";

function parseToken(token: string): { userId: string; email: string; role: string; expires: number } | null {
  try {
    const decoded = Buffer.from(token, "base64url").toString();
    const payload = JSON.parse(decoded);
    if (payload.expires < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("slimy_session")?.value;

  if (!token) {
    return NextResponse.json({ success: false, error: "No session" }, { status: 401 });
  }

  const session = parseToken(token);
  if (!session) {
    return NextResponse.json({ success: false, error: "Invalid session" }, { status: 401 });
  }

  return NextResponse.json({
    id: session.userId,
    username: session.email.split("@")[0],
    email: session.email,
    role: session.role,
  });
}
