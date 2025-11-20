import { NextRequest, NextResponse } from "next/server";
import { proxyToAdminApi } from "@/lib/api-client";

export const runtime = "nodejs";
export const revalidate = 0; // No caching for task details

/**
 * GET /api/agents/tasks/[id]
 * Get a specific task by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const response = await proxyToAdminApi(`/api/agents/tasks/${id}`, {
      method: "GET",
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          ok: false,
          code: response.code,
          message: response.message,
        },
        { status: response.status || 500 }
      );
    }

    return NextResponse.json(response.data);
  } catch (error) {
    console.error("Agent task detail API error:", error);
    return NextResponse.json(
      {
        ok: false,
        code: "TASK_FETCH_ERROR",
        message: "Failed to fetch agent task",
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/agents/tasks/[id]
 * Update task status (for manual control/testing)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const response = await proxyToAdminApi(`/api/agents/tasks/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          ok: false,
          code: response.code,
          message: response.message,
        },
        { status: response.status || 500 }
      );
    }

    return NextResponse.json(response.data);
  } catch (error) {
    console.error("Update agent task API error:", error);
    return NextResponse.json(
      {
        ok: false,
        code: "TASK_UPDATE_ERROR",
        message: "Failed to update agent task",
      },
      { status: 500 }
    );
  }
}
