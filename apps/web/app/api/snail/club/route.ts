import { NextRequest, NextResponse } from "next/server";
import { RowDataPacket } from "@slimy/db";
import { requireLeaderOrAbove } from "@/lib/auth/owner";
import { getClubPool } from "@/lib/club-db";

export const dynamic = "force-dynamic";

interface ClubMember {
  name: string;
  sim_power: number;
  total_power: number;
  sim_prev: number;
  total_prev: number;
  sim_pct_change: number;
  total_pct_change: number;
  latest_at: string;
}

interface ClubApiResponse {
  members: ClubMember[];
  lastUpdated: string;
  totalMembers: number;
  avgTotalPower: number;
}

export async function GET(request: NextRequest) {
  try {
    await requireLeaderOrAbove(request);

    const p = getClubPool();
    const connection = await p.getConnection();

    try {
      const [rows] = await connection.query<RowDataPacket[]>(`
        SELECT name_display, sim_power, total_power, sim_prev, total_prev,
               sim_pct_change, total_pct_change, latest_at
        FROM club_latest
        ORDER BY total_power DESC
      `);

      const [tsRows] = await connection.query<RowDataPacket[]>(`
        SELECT MAX(latest_at) as last_updated
        FROM club_latest
      `);

      const lastUpdated = tsRows[0]?.last_updated
        ? new Date(tsRows[0].last_updated).toISOString()
        : new Date().toISOString();

      const members: ClubMember[] = rows.map((row) => ({
        name: row.name_display ?? "",
        sim_power: Number(row.sim_power) || 0,
        total_power: Number(row.total_power) || 0,
        sim_prev: Number(row.sim_prev) || 0,
        total_prev: Number(row.total_prev) || 0,
        sim_pct_change: Number(row.sim_pct_change) || 0,
        total_pct_change: Number(row.total_pct_change) || 0,
        latest_at: row.latest_at ? new Date(row.latest_at).toISOString() : lastUpdated,
      }));

      const totalPower = members.reduce((sum, m) => sum + m.total_power, 0);
      const avgTotalPower = members.length > 0 ? totalPower / members.length : 0;

      const response: ClubApiResponse = {
        members,
        lastUpdated,
        totalMembers: members.length,
        avgTotalPower: Math.round(avgTotalPower),
      };

      return NextResponse.json(response);
    } finally {
      connection.release();
    }
  } catch (error) {
    if (error instanceof NextResponse) {
      return error;
    }

    const message = error instanceof Error ? error.message : "internal_server_error";
    console.error("[/api/snail/club GET] Error:", message);

    if (message.includes("must be configured") || message.includes("ECONNREFUSED")) {
      return NextResponse.json(
        { error: "database_not_configured", message: "Club MySQL not configured on this server" },
        { status: 503 }
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
