import { NextRequest, NextResponse } from "next/server";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";

export const runtime = "nodejs";

interface ReportRequest {
  code: string;
  reason?: string;
  guildId?: string;
  userId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ReportRequest = await request.json();

    if (!body.code) {
      return NextResponse.json(
        { ok: false, message: "Code is required" },
        { status: 400 }
      );
    }

    // Create report log entry
    const report = {
      code: body.code,
      reason: body.reason || "dead",
      guildId: body.guildId || "unknown",
      userId: body.userId || "unknown",
      timestamp: new Date().toISOString(),
      ip: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown",
    };

    // Log to file (no DB needed)
    const reportsDir = join(process.cwd(), "data/reports");
    if (!existsSync(reportsDir)) {
      mkdirSync(reportsDir, { recursive: true });
    }

    const logFile = join(reportsDir, `${new Date().toISOString().split("T")[0]}.jsonl`);
    const logEntry = JSON.stringify(report) + "\n";

    writeFileSync(logFile, logEntry, { flag: "a" });

    console.info("Code reported:", report);

    return NextResponse.json({
      ok: true,
      message: "Code reported successfully",
    });
  } catch (error) {
    console.error("Report error:", error);

    return NextResponse.json(
      {
        ok: false,
        code: "REPORT_ERROR",
        message: "Failed to report code",
      },
      { status: 500 }
    );
  }
}
