import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// Simple base64 encoded token (not secure, but works for testing)
// In production, use proper JWT
function createToken(payload: object): string {
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return encoded;
}

function _parseToken(token: string): { userId: string; email: string; role: string; expires: number } | null {
  try {
    const decoded = Buffer.from(token, "base64url").toString();
    const payload = JSON.parse(decoded);
    if (payload.expires < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

// Known users
const users = new Map<string, { id: string; email: string; username: string; role: string }>();
users.set("gurth@slimyai.cuz", { 
  id: "cmlku40d90000shkt4f97jt0v", 
  email: "gurth@slimyai.cuz", 
  username: "GurthBr0oks", 
  role: "owner" 
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ success: false, error: "Email required" }, { status: 400 });
    }

    // Find or create user
    let user = users.get(email.toLowerCase());
    
    if (!user) {
      user = {
        id: "user_" + Date.now(),
        email: email.toLowerCase(),
        username: email.split("@")[0],
        role: "member"
      };
      users.set(email.toLowerCase(), user);
    }

    // Create token with user info
    const token = createToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      expires: Date.now() + 30 * 24 * 60 * 60 * 1000,
    });

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set("slimy_session", token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
    });

    return NextResponse.json({
      success: true,
      user: { id: user.id, username: user.username, email: user.email },
    });
  } catch (error) {
    console.error("[local-auth/login] Error:", error);
    return NextResponse.json({ success: false, error: "Login failed" }, { status: 500 });
  }
}
