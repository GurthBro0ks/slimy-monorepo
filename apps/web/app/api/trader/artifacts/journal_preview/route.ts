/**
 * GET /api/trader/artifacts/journal_preview
 *
 * Returns the last N journal entries.
 * Requires trader auth + artifact allowlist.
 *
 * Query params:
 * - limit: number (default 20, max 100)
 */

import { NextRequest, NextResponse } from "next/server";
import { validateTraderSession } from "@/lib/trader/auth/session";
import {
  gateArtifactAccess,
  readJournalPreview,
  readPullStatus,
  type ArtifactApiResponse,
  type JournalPreview,
} from "@/lib/trader/artifacts";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    // Step 1: Validate trader session
    const session = await validateTraderSession();
    if (!session.authenticated || !session.user) {
      return NextResponse.json(
        { ok: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    // Step 2: Check artifact allowlist (fail-closed)
    const gate = await gateArtifactAccess(session.user.id);
    if (gate) {
      return NextResponse.json(gate.body, { status: gate.status });
    }

    // Step 3: Parse query params
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get("limit");
    const limit = Math.min(
      Math.max(parseInt(limitParam || "20", 10) || 20, 1),
      100
    );

    // Step 4: Read artifacts
    const [journalResult, pullResult] = await Promise.all([
      readJournalPreview(limit),
      readPullStatus(),
    ]);

    // Step 5: Build response
    const response: ArtifactApiResponse<JournalPreview> = {
      ok: journalResult.status === "OK",
      data: journalResult.data,
      status: journalResult.status,
      error: journalResult.error,
      artifact_age_sec: journalResult.age_seconds,
      last_pull_utc: pullResult.data?.last_pull_utc ?? null,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[ArtifactAPI] Journal error:", error);
    return NextResponse.json(
      {
        ok: false,
        data: null,
        status: "PARSE_ERROR",
        error: "Internal error",
        artifact_age_sec: null,
        last_pull_utc: null,
      },
      { status: 500 }
    );
  }
}
