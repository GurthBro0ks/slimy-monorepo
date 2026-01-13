import { NextRequest, NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth/owner";
import {
  getOwnerAuditLogs,
  parseAuditChanges,
  OwnerAuditAction,
} from "@/lib/owner/audit";
import { z } from "zod";

export const dynamic = "force-dynamic";

const QuerySchema = z.object({
  limit: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().min(1).max(500)).optional(),
  action: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    await requireOwner(request);

    const query = {
      limit: request.nextUrl.searchParams.get("limit"),
      action: request.nextUrl.searchParams.get("action"),
    };

    const parsed = QuerySchema.safeParse(query);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "validation_error",
          details: parsed.error.issues,
        },
        { status: 400 }
      );
    }

    const { limit = 100, action } = parsed.data;

    const logs = await getOwnerAuditLogs(
      limit,
      action as OwnerAuditAction | undefined
    );

    return NextResponse.json({
      ok: true,
      logs: logs.map((log) => ({
        id: log.id,
        actorId: log.actorId,
        actor: {
          id: log.actor.id,
          email: log.actor.email,
        },
        action: log.action,
        resourceType: log.resourceType,
        resourceId: log.resourceId,
        changes: parseAuditChanges(log.changes || null),
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
        createdAt: log.createdAt,
      })),
      count: logs.length,
    });
  } catch (error) {
    if (error instanceof NextResponse) {
      return error;
    }

    console.error("[/api/owner/audit GET] Unexpected error:", error);
    return NextResponse.json(
      { error: "internal_server_error" },
      { status: 500 }
    );
  }
}
