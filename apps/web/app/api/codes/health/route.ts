import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Simple health check for codes service
    return NextResponse.json({
      status: "healthy",
      service: "codes",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        service: "codes",
        error: "Health check failed",
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
