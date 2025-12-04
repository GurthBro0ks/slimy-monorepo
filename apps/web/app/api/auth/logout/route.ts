import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { apiClient } from "@/lib/api-client";
import { AUTH_COOKIE_NAME } from "@/lib/auth/constants";

export const dynamic = "force-dynamic";

export async function POST() {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();

    try {
        // Notify backend to clear session
        await apiClient.post("/api/auth/logout", {}, {
            useCache: false,
            headers: {
                Cookie: cookieHeader,
            },
        });
    } catch (error) {
        console.error("[Logout] Backend logout failed:", error);
        // Continue to clear client cookies anyway
    }

    const response = NextResponse.json({ success: true });

    // Force clear all possible auth cookies
    const cookiesToClear = [
        AUTH_COOKIE_NAME, // 'slimy_admin'
        "slimy_session",
        "slimy_admin_token",
        "oauth_state",
        "connect.sid",
    ];

    for (const cookieName of cookiesToClear) {
        response.cookies.set(cookieName, "", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 0,
        });
    }

    return response;
}
