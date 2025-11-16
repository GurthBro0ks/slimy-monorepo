import { NextResponse } from "next/server";

export const revalidate = 60; // s-maxage=60

export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      ts: new Date().toISOString(),
      env: process.env.NODE_ENV,
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    }
  );
}
