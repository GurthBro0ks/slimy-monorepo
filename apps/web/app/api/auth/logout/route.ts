import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { apiClient } from "@/lib/api-client";

export async function POST() {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();

    try {
        // Notify backend to clear session
        await apiClient.post("/api/auth/logout", {}, {
            headers: {
                Cookie: cookieHeader,
            },
        });
    } catch (error) {
        console.error("[Logout] Backend logout failed:", error);
        // Continue to clear client cookies anyway
    }

    const response = NextResponse.json({ success: true });

    // Force clear cookies
    response.cookies.delete("slimy_admin");
    response.cookies.delete("oauth_state");

    return response;
}
