import { NextRequest, NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth/owner";
import {
  getOwnerAuditLogs,
  parseAuditChanges,
  OwnerAuditAction,
} from "@/lib/owner/audit";
import { db as prisma } from "@/lib/db";
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
      limit: request.nextUrl.searchParams.get("limit") || undefined,
      action: request.nextUrl.searchParams.get("action") || undefined,
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

    // Enrich logs with actor email
    const logsWithEmail = await Promise.all(
      logs.map(async (log) => {
        let actorEmail = "unknown";
        try {
          const user = await prisma.slimyUser.findUnique({
            where: { id: log.actorId },
            select: { email: true },
          });
          if (user) actorEmail = user.email;
        } catch {
          // User may have been deleted
        }
        return {
          id: log.id,
          actorId: log.actorId,
          actorEmail,
          action: log.action,
          resourceType: log.resourceType,
          resourceId: log.resourceId,
          changes: parseAuditChanges(
            typeof log.changes === "string" ? log.changes : JSON.stringify(log.changes) || null
          ),
          ipAddress: log.ipAddress,
          userAgent: log.userAgent,
          createdAt: log.createdAt,
        };
      })
    );

    return NextResponse.json({
      ok: true,
      logs: logsWithEmail,
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
