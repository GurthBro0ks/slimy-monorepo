import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";
import { requireOwner } from "@/lib/auth/owner";

export const dynamic = "force-dynamic";

let pool: mysql.Pool | null = null;

function getPool(): mysql.Pool {
  if (!pool) {
    const host = process.env.CLUB_MYSQL_HOST;
    const port = parseInt(process.env.CLUB_MYSQL_PORT || "3306", 10);
    const user = process.env.CLUB_MYSQL_USER;
    const password = process.env.CLUB_MYSQL_PASSWORD;
    const database = process.env.CLUB_MYSQL_DATABASE || "slimy_bot";

    if (!host || !user || !password) {
      throw new Error(
        "CLUB_MYSQL_HOST, CLUB_MYSQL_USER, and CLUB_MYSQL_PASSWORD must be configured"
      );
    }

    pool = mysql.createPool({
      host,
      port,
      user,
      password,
      database,
      waitForConnections: true,
      connectionLimit: 5,
      queueLimit: 0,
    });
  }
  return pool;
}

export async function GET(request: NextRequest) {
  try {
    await requireOwner(request);

    let connection: mysql.PoolConnection | null = null;

    try {
      const p = getPool();
      connection = await p.getConnection();

      const [summaryRows] = await connection.query<mysql.RowDataPacket[]>(`
        SELECT
          COUNT(*) as totalMembers,
          SUM(sim_power) as totalSimPower,
          SUM(total_power) as totalPower,
          AVG(sim_power) as avgSimPower,
          AVG(total_power) as avgTotalPower,
          MAX(latest_at) as lastUpdated
        FROM club_latest
      `);

      const [topSimRows] = await connection.query<mysql.RowDataPacket[]>(`
        SELECT name_display as name, sim_power, total_power, sim_prev
        FROM club_latest
        ORDER BY sim_power DESC
        LIMIT 10
      `);

      const [topTotalRows] = await connection.query<mysql.RowDataPacket[]>(`
        SELECT name_display as name, sim_power, total_power
        FROM club_latest
        ORDER BY total_power DESC
        LIMIT 10
      `);

      const [moversRows] = await connection.query<mysql.RowDataPacket[]>(`
        SELECT name_display as name, sim_power, sim_prev,
          (sim_power - sim_prev) as wow_change,
          CASE WHEN sim_prev > 0 THEN ((sim_power - sim_prev) / sim_prev * 100) ELSE NULL END as wow_pct
        FROM club_latest
        WHERE sim_prev IS NOT NULL AND sim_prev != sim_power
        ORDER BY (sim_power - sim_prev) DESC
        LIMIT 5
      `);

      const [declinersRows] = await connection.query<mysql.RowDataPacket[]>(`
        SELECT name_display as name, sim_power, sim_prev,
          (sim_power - sim_prev) as wow_change,
          CASE WHEN sim_prev > 0 THEN ((sim_power - sim_prev) / sim_prev * 100) ELSE NULL END as wow_pct
        FROM club_latest
        WHERE sim_prev IS NOT NULL AND sim_prev != sim_power
        ORDER BY (sim_power - sim_prev) ASC
        LIMIT 5
      `);

      const s = summaryRows[0];
      return NextResponse.json({
        ok: true,
        summary: {
          totalMembers: Number(s?.totalMembers) || 0,
          totalSimPower: Number(s?.totalSimPower) || 0,
          totalPower: Number(s?.totalPower) || 0,
          avgSimPower: Math.round(Number(s?.avgSimPower) || 0),
          avgTotalPower: Math.round(Number(s?.avgTotalPower) || 0),
          lastUpdated: s?.lastUpdated
            ? new Date(s.lastUpdated).toISOString()
            : new Date().toISOString(),
        },
        topSim: topSimRows.map((r) => ({
          name: String(r.name ?? ""),
          simPower: Number(r.sim_power) || 0,
          totalPower: Number(r.total_power) || 0,
          simPrev: r.sim_prev != null ? Number(r.sim_prev) : null,
        })),
        topTotal: topTotalRows.map((r) => ({
          name: String(r.name ?? ""),
          simPower: Number(r.sim_power) || 0,
          totalPower: Number(r.total_power) || 0,
        })),
        movers: moversRows.map((r) => ({
          name: String(r.name ?? ""),
          simPower: Number(r.sim_power) || 0,
          simPrev: Number(r.sim_prev) || 0,
          wowChange: Number(r.wow_change) || 0,
          wowPct:
            r.wow_pct != null
              ? Math.round(Number(r.wow_pct) * 10) / 10
              : null,
        })),
        decliners: declinersRows.map((r) => ({
          name: String(r.name ?? ""),
          simPower: Number(r.sim_power) || 0,
          simPrev: Number(r.sim_prev) || 0,
          wowChange: Number(r.wow_change) || 0,
          wowPct:
            r.wow_pct != null
              ? Math.round(Number(r.wow_pct) * 10) / 10
              : null,
        })),
      });
    } finally {
      if (connection) {
        connection.release();
      }
    }
  } catch (error) {
    if (error instanceof NextResponse) {
      return error;
    }

    const message =
      error instanceof Error ? error.message : "internal_server_error";
    console.error("[/api/snail/stats GET] Error:", message);

    if (
      message.includes("must be configured") ||
      message.includes("ECONNREFUSED")
    ) {
      return NextResponse.json(
        {
          error: "database_not_configured",
          message: "Club MySQL not configured on this server",
        },
        { status: 503 }
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
