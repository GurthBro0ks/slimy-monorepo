import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";
import { requireOwner } from "@/lib/auth/owner";

export const dynamic = "force-dynamic";

interface ClubMember {
  name: string;
  sim_power: number;
  total_power: number;
  change_pct: number;
}

interface ClubApiResponse {
  members: ClubMember[];
  lastUpdated: string;
  totalMembers: number;
  avgTotalPower: number;
}

// Connection pool for MySQL
let pool: mysql.Pool | null = null;

function getPool(): mysql.Pool {
  if (!pool) {
    const host = process.env.CLUB_MYSQL_HOST;
    const port = parseInt(process.env.CLUB_MYSQL_PORT || "3306", 10);
    const user = process.env.CLUB_MYSQL_USER;
    const password = process.env.CLUB_MYSQL_PASSWORD;
    const database = process.env.CLUB_MYSQL_DATABASE || "slimy_bot";

    if (!host || !user || !password) {
      throw new Error("CLUB_MYSQL_HOST, CLUB_MYSQL_USER, and CLUB_MYSQL_PASSWORD must be configured");
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

// GET /api/snail/club
// Returns club member data from NUC1 MySQL
export async function GET(request: NextRequest) {
  try {
    // Require owner authentication
    await requireOwner(request);

    let connection: mysql.PoolConnection | null = null;

    try {
      const p = getPool();
      connection = await p.getConnection();

      // Get club data sorted by total_power DESC
      const [rows] = await connection.query<mysql.RowDataPacket[]>(`
        SELECT name, sim_power, total_power, change_pct
        FROM club_latest
        ORDER BY total_power DESC
      `);

      // Get last updated timestamp
      const [tsRows] = await connection.query<mysql.RowDataPacket[]>(`
        SELECT MAX(snapshot_at) as last_updated
        FROM club_latest
      `);

      const lastUpdated = tsRows[0]?.last_updated
        ? new Date(tsRows[0].last_updated).toISOString()
        : new Date().toISOString();

      const members: ClubMember[] = rows.map((row) => ({
        name: row.name ?? "",
        sim_power: Number(row.sim_power) || 0,
        total_power: Number(row.total_power) || 0,
        change_pct: Number(row.change_pct) || 0,
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
      if (connection) {
        connection.release();
      }
    }
  } catch (error) {
    if (error instanceof NextResponse) {
      return error;
    }

    const message = error instanceof Error ? error.message : "internal_server_error";
    console.error("[/api/snail/club GET] Error:", message);

    // Return 503 if database is not configured
    if (message.includes("must be configured") || message.includes("ECONNREFUSED")) {
      return NextResponse.json(
        { error: "database_not_configured", message: "Club MySQL not configured on this server" },
        { status: 503 }
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
