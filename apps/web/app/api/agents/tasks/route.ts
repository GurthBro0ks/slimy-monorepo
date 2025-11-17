import { NextRequest, NextResponse } from "next/server";
import { proxyToAdminApi } from "@/lib/api-client";

export const runtime = "nodejs";
export const revalidate = 0; // No caching for tasks

/**
 * GET /api/agents/tasks
 * List agent tasks with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const queryString = searchParams.toString();
    const path = queryString ? `/api/agents/tasks?${queryString}` : "/api/agents/tasks";

    const response = await proxyToAdminApi(path, {
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
    console.error("Agent tasks list API error:", error);
    return NextResponse.json(
      {
        ok: false,
        code: "TASKS_FETCH_ERROR",
        message: "Failed to fetch agent tasks",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/agents/tasks
 * Create a new agent task
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await proxyToAdminApi("/api/agents/tasks", {
      method: "POST",
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

    return NextResponse.json(response.data, { status: 201 });
  } catch (error) {
    console.error("Create agent task API error:", error);
    return NextResponse.json(
      {
        ok: false,
        code: "TASK_CREATE_ERROR",
        message: "Failed to create agent task",
      },
      { status: 500 }
    );
  }
}
