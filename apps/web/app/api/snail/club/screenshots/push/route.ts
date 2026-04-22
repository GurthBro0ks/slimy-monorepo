import { NextRequest, NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth/owner";
import mysql from "mysql2/promise";

export const runtime = "nodejs";

const GUILD_ID = process.env.DEFAULT_GUILD_ID || "1176605506912141444";

interface PushMember {
  name: string;
  sim_power: number;
  total_power: number;
  member_id?: number;
}

export async function POST(request: NextRequest) {
  try {
    try {
      await requireOwner(request);
    } catch (authError: unknown) {
      if (authError instanceof NextResponse) return authError;
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    if (!body.members || !Array.isArray(body.members)) {
      return NextResponse.json(
        { error: "members array is required" },
        { status: 400 }
      );
    }

    const members: PushMember[] = body.members;
    if (members.length === 0) {
      return NextResponse.json(
        { error: "No members to push" },
        { status: 400 }
      );
    }

    const mysqlHost = process.env.CLUB_MYSQL_HOST;
    if (!mysqlHost) {
      return NextResponse.json({
        ok: true,
        imported: members.length,
        errors: [],
        mode: "sandbox",
      });
    }

    const pool = mysql.createPool({
      host: mysqlHost,
      port: parseInt(process.env.CLUB_MYSQL_PORT || "3306", 10),
      user: process.env.CLUB_MYSQL_USER,
      password: process.env.CLUB_MYSQL_PASSWORD,
      database: process.env.CLUB_MYSQL_DATABASE || "slimy",
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });

    try {
      let imported = 0;
      const errors: string[] = [];

      for (const member of members) {
        if (!member.name || typeof member.name !== "string" || !member.name.trim()) continue;
        if (member.sim_power == null && member.total_power == null) continue;

        const memberId = parseInt(String(member.member_id ?? 0), 10) || 0;
        const name = member.name.trim();
        const simPower = parseInt(String(member.sim_power ?? 0), 10) || 0;
        const totalPower = parseInt(String(member.total_power ?? 0), 10) || 0;

        try {
          await pool.query(
            `INSERT INTO club_latest (guild_id, member_id, name_display, sim_power, total_power, sim_prev, total_prev, sim_pct_change, total_pct_change, latest_at)
             VALUES (?, ?, ?, ?, ?, 0, 0, 0, 0, NOW())
             ON DUPLICATE KEY UPDATE
               sim_prev = sim_power,
               total_prev = total_power,
               sim_power = ?,
               total_power = ?,
               name_display = ?,
               sim_pct_change = CASE WHEN sim_prev > 0 THEN ROUND((? - sim_prev) / sim_prev * 100, 2) ELSE 0 END,
               total_pct_change = CASE WHEN total_prev > 0 THEN ROUND((? - total_prev) / total_prev * 100, 2) ELSE 0 END,
               latest_at = NOW()`,
            [
              GUILD_ID, memberId, name, simPower, totalPower,
              simPower, totalPower, name,
              simPower, totalPower,
            ]
          );
          imported++;
        } catch (rowErr) {
          errors.push(`${name}: ${rowErr instanceof Error ? rowErr.message : String(rowErr)}`);
        }
      }

      await pool.end();

      return NextResponse.json({
        ok: true,
        imported,
        errors,
      });
    } catch (dbError) {
      console.error("[/api/snail/club/screenshots/push] DB error:", dbError);
      try { await pool.end(); } catch {}
      return NextResponse.json(
        { error: "Database error", details: String(dbError) },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("[/api/snail/club/screenshots/push] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
