import { NextRequest, NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth/owner";
import * as XLSX from "xlsx";
import mysql from "mysql2/promise";

export const runtime = "nodejs";

const GUILD_ID = process.env.DEFAULT_GUILD_ID || "1176605506912141444";

interface MemberRow {
  name: string;
  member_id: number;
  sim_power: number;
  total_power: number;
}

interface ImportResult {
  ok: boolean;
  imported: number;
  errors: string[];
  mode?: string;
}

function parseXlsxBuffer(buffer: Buffer): { members: MemberRow[]; errors: string[] } {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return { members: [], errors: ["No sheets found in workbook"] };

  const worksheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet);

  const members: MemberRow[] = [];
  const errors: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const name = String(row["Name"] ?? row["name"] ?? "").trim();
    const rawMemberId = row["Member ID"] ?? row["member_id"] ?? row["MemberID"] ?? "";
    const rawSimPower = row["SIM Power"] ?? row["sim_power"] ?? row["SimPower"] ?? 0;
    const rawTotalPower = row["Total Power"] ?? row["total_power"] ?? row["TotalPower"] ?? 0;

    if (!name) {
      errors.push(`Row ${i + 2}: missing Name`);
      continue;
    }

    const memberId = parseInt(String(rawMemberId), 10);
    if (isNaN(memberId) || memberId <= 0) {
      errors.push(`Row ${i + 2} (${name}): invalid Member ID`);
      continue;
    }

    const simPower = parseFloat(String(rawSimPower)) || 0;
    const totalPower = parseFloat(String(rawTotalPower)) || 0;

    members.push({ name, member_id: memberId, sim_power: simPower, total_power: totalPower });
  }

  return { members, errors };
}

export async function POST(request: NextRequest) {
  try {
    try {
      await requireOwner(request);
    } catch (authError: unknown) {
      if (authError instanceof NextResponse) return authError;
      return NextResponse.json(
        { error: "unauthorized" },
        { status: 401 }
      );
    }

    const contentType = request.headers.get("content-type") || "";
    let members: MemberRow[] = [];
    let errors: string[] = [];

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file");

      if (!file || !(file instanceof File)) {
        return NextResponse.json(
          { error: "No .xlsx file provided" },
          { status: 400 }
        );
      }

      if (!file.name.endsWith(".xlsx")) {
        return NextResponse.json(
          { error: "Only .xlsx files are accepted" },
          { status: 400 }
        );
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const parsed = parseXlsxBuffer(buffer);
      members = parsed.members;
      errors = parsed.errors;
    } else {
      const body = await request.json();
      if (!body.members || !Array.isArray(body.members)) {
        return NextResponse.json(
          { error: "members array is required" },
          { status: 400 }
        );
      }

      for (const m of body.members) {
        if (!m.name || typeof m.name !== "string" || !m.name.trim()) continue;
        if (m.sim_power == null && m.total_power == null) continue;
        members.push({
          name: m.name.trim(),
          member_id: parseInt(String(m.member_id ?? 0), 10) || 0,
          sim_power: parseFloat(String(m.sim_power ?? 0)) || 0,
          total_power: parseFloat(String(m.total_power ?? 0)) || 0,
        });
      }
    }

    if (members.length === 0) {
      return NextResponse.json(
        { error: "No valid members to import", errors },
        { status: 400 }
      );
    }

    const mysqlHost = process.env.CLUB_MYSQL_HOST;
    if (!mysqlHost) {
      return NextResponse.json({
        ok: true,
        imported: members.length,
        errors,
        mode: "sandbox",
      } satisfies ImportResult);
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
      const dbErrors: string[] = [];

      for (const member of members) {
        try {
          if (member.member_id > 0) {
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
                GUILD_ID, member.member_id, member.name, member.sim_power, member.total_power,
                member.sim_power, member.total_power, member.name,
                member.sim_power, member.total_power,
              ]
            );
          } else {
            await pool.query(
              `INSERT INTO club_latest (guild_id, member_id, name_display, sim_power, total_power, sim_prev, total_prev, sim_pct_change, total_pct_change, latest_at)
               VALUES (?, 0, ?, ?, ?, 0, 0, 0, 0, NOW())
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
                GUILD_ID, member.name, member.sim_power, member.total_power,
                member.sim_power, member.total_power, member.name,
                member.sim_power, member.total_power,
              ]
            );
          }
          imported++;
        } catch (rowErr) {
          dbErrors.push(`${member.name}: ${rowErr instanceof Error ? rowErr.message : String(rowErr)}`);
        }
      }

      await pool.end();

      return NextResponse.json({
        ok: true,
        imported,
        errors: [...errors, ...dbErrors],
      } satisfies ImportResult);
    } catch (dbError) {
      console.error("[/api/snail/club/import] DB error:", dbError);
      try { await pool.end(); } catch {}
      return NextResponse.json(
        { error: "Database error", details: String(dbError) },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("[/api/snail/club/import] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
