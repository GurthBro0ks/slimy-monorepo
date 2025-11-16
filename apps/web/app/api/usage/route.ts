import { NextResponse } from "next/server";
import { getMockUsageData } from "@/lib/usage-thresholds";

export const runtime = "edge";
export const revalidate = 30; // Revalidate every 30 seconds

/**
 * GET /api/usage
 * Returns current user usage data (mocked for now)
 */
export async function GET() {
  try {
    // In a real application, this would fetch data from a database or a usage tracking service.
    // We will simulate different usage scenarios based on a query parameter or session data.
    
    // For demonstration, we'll simulate a "pro" user near the soft cap.
    const mockSpend = 950;
    const usageData = getMockUsageData(mockSpend);

    return NextResponse.json({
      ok: true,
      data: usageData,
    });
  } catch (error) {
    console.error("Usage API error:", error);
    return NextResponse.json(
      {
        ok: false,
        code: "USAGE_FETCH_ERROR",
        message: "Failed to fetch usage data",
      },
      { status: 500 }
    );
  }
}
