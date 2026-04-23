import { NextRequest, NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth/owner";
import { insertImportLog } from "@/lib/club/import-log";
import { getClubPool } from "@/lib/club-db";

export const runtime = "nodejs";

const GUILD_ID = process.env.DEFAULT_GUILD_ID || "1176605506912141444";

interface PushMember {
  name: string;
  sim_power: number;
  total_power: number;
  member_id?: number;
}

interface PushDetail {
  name: string;
  sim_power: number;
  total_power: number;
  status: "matched" | "new" | "error";
  error?: string;
}

export async function POST(request: NextRequest) {
  let ownerEmail = "unknown";
  let ownerRole = "unknown";
  try {
    let ownerCtx: { owner: { email: string; role: string } } | null = null;
    try {
      ownerCtx = await requireOwner(request);
      ownerEmail = ownerCtx.owner.email;
      ownerRole = ownerCtx.owner.role;
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
    const provider = body.provider || "unknown";
    if (members.length === 0) {
      return NextResponse.json(
        { error: "No members to push" },
        { status: 400 }
      );
    }

    const mysqlHost = process.env.CLUB_MYSQL_HOST;
    if (!mysqlHost) {
      const details: PushDetail[] = members.map((m) => ({
        name: m.name,
        sim_power: m.sim_power ?? 0,
        total_power: m.total_power ?? 0,
        status: "new" as const,
      }));
      return NextResponse.json({
        ok: true,
        imported: members.length,
        errors: [],
        mode: "sandbox",
        details,
        matchedCount: 0,
        newCount: members.length,
      });
    }

    const pool = getClubPool();

    try {
      let imported = 0;
      const errors: string[] = [];
      const details: PushDetail[] = [];
      let matchedCount = 0;
      let newCount = 0;

      const [existingRows] = await pool.query(
        `SELECT member_id, name_display FROM club_latest WHERE guild_id = ?`,
        [GUILD_ID]
      ) as [Array<{ member_id: number; name_display: string }>, unknown];

      const existingByName = new Map<string, number>();
      const existingIds = new Set<number>();
      for (const row of existingRows) {
        existingByName.set(row.name_display.toLowerCase(), row.member_id);
        existingIds.add(row.member_id);
      }

      const nameToId = new Map<string, number>();
      const nameToStatus = new Map<string, "matched" | "new">();
      const assignedIds = new Set<number>(existingIds);

      for (const member of members) {
        if (!member.name || typeof member.name !== "string" || !member.name.trim()) continue;
        if (member.sim_power == null && member.total_power == null) continue;

        const name = member.name.trim();
        const nameKey = name.toLowerCase();

        const rawId = parseInt(String(member.member_id ?? 0), 10) || 0;
        if (rawId > 0) {
          nameToId.set(nameKey, rawId);
          nameToStatus.set(nameKey, "matched");
          assignedIds.add(rawId);
          continue;
        }

        if (nameToId.has(nameKey)) continue;

        const existingId = existingByName.get(nameKey);
        if (existingId !== undefined) {
          nameToId.set(nameKey, existingId);
          nameToStatus.set(nameKey, "matched");
          continue;
        }

        let hash = 0;
        for (let i = 0; i < nameKey.length; i++) {
          hash = ((hash << 5) - hash + nameKey.charCodeAt(i)) | 0;
        }
        let negativeId = -Math.abs(hash || 1);
        while (assignedIds.has(negativeId)) {
          negativeId--;
        }
        nameToId.set(nameKey, negativeId);
        nameToStatus.set(nameKey, "new");
        assignedIds.add(negativeId);
      }

      for (const member of members) {
        if (!member.name || typeof member.name !== "string" || !member.name.trim()) continue;
        if (member.sim_power == null && member.total_power == null) continue;

        const name = member.name.trim();
        const nameKey = name.toLowerCase();
        const memberId = nameToId.get(nameKey) ?? 0;
        const simPower = parseInt(String(member.sim_power ?? 0), 10) || 0;
        const totalPower = parseInt(String(member.total_power ?? 0), 10) || 0;
        const status = nameToStatus.get(nameKey) || "new";

        try {
          await pool.query(
            `INSERT INTO club_latest (guild_id, member_id, name_display, sim_power, total_power, sim_prev, total_prev, sim_pct_change, total_pct_change, latest_at)
             VALUES (?, ?, ?, ?, ?, 0, 0, 0, 0, NOW())
             ON DUPLICATE KEY UPDATE
               sim_prev = sim_power,
               total_prev = IF(VALUES(total_power) = 0, total_prev, total_power),
               sim_power = VALUES(sim_power),
               total_power = IF(VALUES(total_power) = 0 AND total_power > 0, total_power, VALUES(total_power)),
               name_display = VALUES(name_display),
               sim_pct_change = CASE WHEN sim_prev > 0 THEN ROUND((sim_power - sim_prev) / sim_prev * 100, 2) ELSE 0 END,
               total_pct_change = CASE WHEN total_prev > 0 THEN ROUND((total_power - total_prev) / total_prev * 100, 2) ELSE 0 END,
               latest_at = NOW()`,
            [
              GUILD_ID, memberId, name, simPower, totalPower,
            ]
          );
          imported++;
          if (status === "matched") matchedCount++;
          else newCount++;
          details.push({ name, sim_power: simPower, total_power: totalPower, status });
        } catch (rowErr) {
          const errMsg = rowErr instanceof Error ? rowErr.message : String(rowErr);
          errors.push(`${name}: ${errMsg}`);
          details.push({ name, sim_power: simPower, total_power: totalPower, status: "error", error: errMsg });
        }
      }

      const memberNames = details.filter((d) => d.status !== "error").map((d) => d.name);
      await insertImportLog({
        guild_id: GUILD_ID,
        action_type: "screenshot_push",
        user_email: ownerEmail,
        user_role: ownerRole,
        member_count: imported,
        members_json: JSON.stringify(memberNames),
        provider,
        source_info: "screenshot upload",
        errors_json: JSON.stringify(errors),
      });

      return NextResponse.json({
        ok: true,
        imported,
        errors,
        details,
        matchedCount,
        newCount,
      });
    } catch (dbError) {
      console.error("[/api/snail/club/screenshots/push] DB error:", dbError);
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
