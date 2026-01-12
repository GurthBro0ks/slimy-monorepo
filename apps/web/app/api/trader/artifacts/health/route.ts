/**
 * GET /api/trader/artifacts/health
 *
 * Returns the shadow trading health artifact.
 * Requires trader auth + artifact allowlist.
 */

import { NextResponse } from "next/server";
import { validateTraderSession } from "@/lib/trader/auth/session";
import {
  gateArtifactAccess,
  readHealth,
  readPullStatus,
  type ArtifactApiResponse,
  type ShadowHealth,
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
    const [healthResult, pullResult] = await Promise.all([
      readHealth(),
      readPullStatus(),
    ]);

    // Step 4: Build response
    const response: ArtifactApiResponse<ShadowHealth> = {
      ok: healthResult.status === "OK",
      data: healthResult.data,
      status: healthResult.status,
      error: healthResult.error,
      artifact_age_sec: healthResult.age_seconds,
      last_pull_utc: pullResult.data?.last_pull_utc ?? null,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[ArtifactAPI] Health error:", error);
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
