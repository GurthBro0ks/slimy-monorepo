import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth/owner";

export const runtime = "nodejs";

interface ClubMemberInput {
  name: string;
  sim_power?: number | null;
  total_power?: number | null;
}

interface ImportBody {
  members: ClubMemberInput[];
  sheetName?: string;
}

/**
 * POST /api/snail/club/import
 * Owner-only endpoint to import club sheet data.
 * Validates members, computes change percentages, upserts to club_latest,
 * and creates a snapshot record.
 */
export async function POST(request: Request) {
  try {
    // Owner-only auth
    try {
      await requireOwner(request);
    } catch (authError: any) {
      const status = authError?.status || 401;
      const body = authError?.body || { error: "unauthorized" };
      return NextResponse.json(body, { status });
    }

    const body: ImportBody = await request.json();

    // Validate body
    if (!body.members || !Array.isArray(body.members)) {
      return NextResponse.json(
        { code: "VALIDATION_ERROR", message: "members array is required" },
        { status: 400 }
      );
    }

    // Validate each member has name + at least one power value
    const validMembers: ClubMemberInput[] = [];
    for (const member of body.members) {
      if (!member.name || typeof member.name !== "string" || member.name.trim() === "") {
        continue; // Skip invalid
      }
      if (member.sim_power == null && member.total_power == null) {
        continue; // Skip if no power data
      }
      validMembers.push({
        name: member.name.trim(),
        sim_power: member.sim_power ?? null,
        total_power: member.total_power ?? null,
      });
    }

    if (validMembers.length === 0) {
      return NextResponse.json(
        { code: "VALIDATION_ERROR", message: "No valid members with name and at least one power value" },
        { status: 400 }
      );
    }

    // Check if MySQL pool is available ( CLUB_MYSQL_HOST env var )
    const mysqlHost = process.env.CLUB_MYSQL_HOST;
    if (!mysqlHost) {
      // Return mock success for development/sandbox mode
      return NextResponse.json({
        ok: true,
        imported: validMembers.length,
        updated: 0,
        new: validMembers.length,
        mode: "sandbox",
        message: "MySQL not configured - running in sandbox mode",
      });
    }

    // Dynamic import mysql2 to avoid issues when not configured
    const mysql = await import("mysql2/promise");

    const pool = mysql.createPool({
      host: process.env.CLUB_MYSQL_HOST,
      port: parseInt(process.env.CLUB_MYSQL_PORT || "3306", 10),
      user: process.env.CLUB_MYSQL_USER,
      password: process.env.CLUB_MYSQL_PASSWORD,
      database: process.env.CLUB_MYSQL_DATABASE || "slimy_bot",
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });

    try {
      // Get current data for each member to compute change_pct
      const memberKeys = validMembers.map((m) => m.name.toLowerCase().replace(/\s+/g, "_"));
      const placeholders = memberKeys.map(() => "?").join(",");
      const [existingRows] = await pool.query(
        `SELECT name, sim_power, total_power FROM club_latest WHERE name IN (${placeholders})`,
        memberKeys
      ) as [any[], any];

      const existingMap = new Map<string, { sim_power: number | null; total_power: number | null }>();
      for (const row of existingRows) {
        existingMap.set(row.name.toLowerCase().replace(/\s+/g, "_"), {
          sim_power: row.sim_power,
          total_power: row.total_power,
        });
      }

      // Upsert each member
      let updated = 0;
      let inserted = 0;
      const now = new Date();

      for (const member of validMembers) {
        const memberKey = member.name.toLowerCase().replace(/\s+/g, "_");
        const existing = existingMap.get(memberKey);

        if (existing) {
          // UPDATE
          await pool.query(
            `UPDATE club_latest SET name = ?, sim_power = ?, total_power = ?, last_seen_at = ?, updated_at = ? WHERE name = ?`,
            [member.name, member.sim_power, member.total_power, now, now, member.name]
          );
          updated++;
        } else {
          // INSERT
          await pool.query(
            `INSERT INTO club_latest (name, sim_power, total_power, last_seen_at, updated_at) VALUES (?, ?, ?, ?, ?)`,
            [member.name, member.sim_power, member.total_power, now, now]
          );
          inserted++;
        }
      }

      // Insert snapshot record
      await pool.query(
        `INSERT INTO club_snapshots (snapshot_time, member_count, sheet_name) VALUES (?, ?, ?)`,
        [now, validMembers.length, body.sheetName || null]
      );

      await pool.end();

      return NextResponse.json({
        ok: true,
        imported: validMembers.length,
        updated,
        new: inserted,
      });
    } catch (dbError) {
      console.error("[API /snail/club/import] Database error:", dbError);
      await pool.end();
      return NextResponse.json(
        { code: "DATABASE_ERROR", message: "Failed to import data" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("[API /snail/club/import] Error:", error);
    return NextResponse.json(
      { code: "INTERNAL_ERROR", message: "Internal server error" },
      { status: 500 }
    );
  }
}
