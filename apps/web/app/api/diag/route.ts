import { NextResponse } from "next/server";

export const revalidate = 60;

export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Web app is running.",
    timestamp: new Date().toISOString(),
  });
}
