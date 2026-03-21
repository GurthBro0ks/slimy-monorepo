import { NextResponse } from "next/server";

export const revalidate = 60;

export async function GET() {
  // Discord OAuth removed - admin-api is no longer running
  // Return local diagnostic info only
  return NextResponse.json({
    status: "ok",
    message: "Web app is running. Admin-API (Discord OAuth) has been decommissioned.",
    timestamp: new Date().toISOString(),
  });
}
