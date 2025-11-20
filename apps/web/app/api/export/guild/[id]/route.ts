import { NextRequest, NextResponse } from "next/server";
import { apiClient } from "@/lib/api-client";
import { requireAuth } from "@/lib/auth/server";
import { AuthenticationError } from "@/lib/errors";

export const runtime = "nodejs";

/**
 * GET /api/export/guild/:id
 * Export guild data as JSON download
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth(request);

    const { id } = await params;
    const { searchParams } = new URL(request.url);

    // Forward query parameters for export options
    const queryParams = new URLSearchParams();
    const maxChatMessages = searchParams.get("maxChatMessages");
    const maxStats = searchParams.get("maxStats");
    const maxAuditLogs = searchParams.get("maxAuditLogs");

    if (maxChatMessages) queryParams.set("maxChatMessages", maxChatMessages);
    if (maxStats) queryParams.set("maxStats", maxStats);
    if (maxAuditLogs) queryParams.set("maxAuditLogs", maxAuditLogs);

    const queryString = queryParams.toString();
    const url = `/api/export/guild/${id}${queryString ? `?${queryString}` : ""}`;

    const result = await apiClient.get(url);

    if (!result.ok) {
      return NextResponse.json(result, { status: result.status || 500 });
    }

    // Create response with appropriate headers for file download
    const exportData = result.data;
    const filename = `guild-${id}-export-${Date.now()}.json`;

    const response = new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });

    return response;
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json(
        { error: "Unauthorized", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }
    console.error("Failed to export guild data:", error);
    return NextResponse.json(
      { error: "Failed to export guild data", code: "EXPORT_ERROR" },
      { status: 500 }
    );
  }
}
