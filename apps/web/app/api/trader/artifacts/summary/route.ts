/**
 * GET /api/trader/artifacts/summary
 *
 * Returns the shadow trading summary artifact.
 * Requires trader auth + artifact allowlist.
 */

import { NextResponse } from "next/server";
import { validateTraderSession } from "@/lib/trader/auth/session";
import {
  gateArtifactAccess,
  readSummary,
  readPullStatus,
  type ArtifactApiResponse,
  type ShadowSummary,
} from "@/lib/trader/artifacts";

export const dynamic = "force-dynamic";

export async function GET() {
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

    // Step 3: Read artifacts
    const [summaryResult, pullResult] = await Promise.all([
      readSummary(),
      readPullStatus(),
    ]);

    // Step 4: Build response
    const response: ArtifactApiResponse<ShadowSummary> = {
      ok: summaryResult.status === "OK",
      data: summaryResult.data,
      status: summaryResult.status,
      error: summaryResult.error,
      artifact_age_sec: summaryResult.age_seconds,
      last_pull_utc: pullResult.data?.last_pull_utc ?? null,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[ArtifactAPI] Summary error:", error);
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
