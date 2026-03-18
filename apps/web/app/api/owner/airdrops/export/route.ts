import { NextRequest, NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth/owner";
import { db as prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/owner/airdrops/export — Export all AirdropCompletion records as CSV
export async function GET(request: NextRequest) {
  try {
    await requireOwner(request);

    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from"); // optional ISO date filter
    const to = searchParams.get("to");     // optional ISO date filter

    const where: any = {};
    if (from || to) {
      where.completedAt = {};
      if (from) where.completedAt.gte = new Date(from);
      if (to) where.completedAt.lte = new Date(to);
    }

    const completions = await prisma.airdropCompletion.findMany({
      where,
      include: {
        task: {
          include: {
            airdrop: true,
          },
        },
      },
      orderBy: { completedAt: "desc" },
    });

    // Build CSV
    const headers = ["Date", "Protocol", "Token", "Task", "Source", "TX Link", "Notes"];
    const rows = completions.map((c) => [
      c.completedAt.toISOString(),
      c.task.airdrop.protocol,
      c.task.airdrop.token,
      c.task.name,
      c.source || "manual",
      c.txLink || "",
      (c.notes || "").replace(/"/g, '""'), // escape quotes
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((r) => r.map((v) => `"${v}"`).join(",")),
    ].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="slimy-completions-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error) {
    if (error instanceof NextResponse) {
      return error;
    }
    console.error("[/api/owner/airdrops/export GET] Error:", error);
    return NextResponse.json({ error: "internal_server_error" }, { status: 500 });
  }
}
