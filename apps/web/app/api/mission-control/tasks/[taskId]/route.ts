import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { slimeChatGetUser } from "@/lib/auth/slimechat-client";

const MC_API_URL = process.env.MISSION_CONTROL_URL;
const MC_API_KEY = process.env.MC_API_KEY;
const OWNER_USER_ID = process.env.OWNER_USER_ID;

async function getAuthContext() {
  const cookieStore = await cookies();
  const token = cookieStore.get("slimy_session")?.value;
  if (!token) return null;

  try {
    const user = await slimeChatGetUser(token);
    return {
      userId: user._id,
      role: user._id === OWNER_USER_ID ? "owner" : "member",
    };
  } catch (error) {
    return null;
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { taskId: string } }
) {
  const { taskId } = await params;
  const auth = await getAuthContext();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (auth.role !== "owner") {
    return NextResponse.json({ error: "Forbidden: Owner access required" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const res = await fetch(`${MC_API_URL}/api/tasks/${taskId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-MC-Key": MC_API_KEY!,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({ error: errText }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
