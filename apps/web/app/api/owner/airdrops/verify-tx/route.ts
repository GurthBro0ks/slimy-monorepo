import { NextRequest, NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth/owner";
import { db as prisma } from "@/lib/db";
import { verifyTx } from "@/lib/tx-verify";

const MAX_VERIFY_PER_REQUEST = 10;

export const dynamic = "force-dynamic";

// GET /api/owner/airdrops/verify-tx?id=completionId
// Returns current verification status without re-checking
export async function GET(request: NextRequest) {
  try {
    await requireOwner(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "missing id" }, { status: 400 });
    }

    const completion = await prisma.airdropCompletion.findUnique({
      where: { id },
      select: {
        id: true,
        txLink: true,
        txVerified: true,
        txVerifiedAt: true,
        txStatus: true,
        txBlockNumber: true,
        txChain: true,
        task: {
          select: {
            airdrop: {
              select: { name: true, token: true },
            },
          },
        },
      },
    });

    if (!completion) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }

    return NextResponse.json({ completion });
  } catch (error) {
    if (error instanceof NextResponse) return error;
    console.error("[/api/owner/airdrops/verify-tx GET]", error);
    return NextResponse.json({ error: "internal_server_error" }, { status: 500 });
  }
}

// POST /api/owner/airdrops/verify-tx
// Body: { completionId?: string; completionIds?: string[] }
export async function POST(request: NextRequest) {
  try {
    await requireOwner(request);
    const body = await request.json().catch(() => ({}));
    const { completionId, completionIds } = body;

    let ids: string[] = [];
    if (completionIds && Array.isArray(completionIds)) {
      ids = completionIds.slice(0, MAX_VERIFY_PER_REQUEST);
    } else if (completionId) {
      ids = [completionId];
    } else {
      return NextResponse.json({ error: "must provide completionId or completionIds" }, { status: 400 });
    }

    // Load completions with their tasks + airdrops for chain detection
    const completions = await prisma.airdropCompletion.findMany({
      where: { id: { in: ids } },
      include: {
        task: {
          include: { airdrop: { select: { name: true, token: true } } },
        },
      },
    });

    let verified = 0;
    let failed = 0;
    let skipped = 0;
    const results: Array<{ id: string; status: string; reason?: string; verified?: boolean; chain?: string; blockNumber?: number }> = [];

    for (const completion of completions) {
      // Extract txHash from txLink if available
      const txHash = extractTxHash(completion.txLink);
      if (!txHash) {
        skipped++;
        results.push({ id: completion.id, status: "skipped", reason: "no tx hash" });
        continue;
      }

      const chain = detectChain(
        completion.task.airdrop.name,
        completion.task.airdrop.token
      );

      const result = await verifyTx(txHash, chain);

      await prisma.airdropCompletion.update({
        where: { id: completion.id },
        data: {
          txVerified: result.verified,
          txStatus: result.status,
          txBlockNumber: result.blockNumber ?? null,
          txChain: chain,
          txVerifiedAt: new Date(),
        },
      });

      if (result.verified) verified++;
      else if (result.status === "error") failed++;
      else skipped++;

      results.push({ id: completion.id, ...result, chain });
    }

    return NextResponse.json({ verified, failed, skipped, results });
  } catch (error) {
    if (error instanceof NextResponse) return error;
    console.error("[/api/owner/airdrops/verify-tx POST]", error);
    return NextResponse.json({ error: "internal_server_error" }, { status: 500 });
  }
}

function extractTxHash(txLink: string | null): string | null {
  if (!txLink) return null;
  // Extract hash from URLs like https://basescan.org/tx/0x... or https://etherscan.io/tx/0x...
  const match = txLink.match(/\/(tx|0x[a-fA-F0-9]{32,})\/?$/);
  if (match) {
    const lastPart = match[1];
    if (lastPart.startsWith("0x")) return lastPart;
    // Try the second-to-last path segment
    const prevMatch = txLink.match(/\/(tx)\/([^/]+)\/?$/);
    if (prevMatch) return prevMatch[2];
  }
  // Fallback: if it looks like a raw hash, return as-is
  if (/^0x[a-fA-F0-9]{64}$/.test(txLink)) return txLink;
  return null;
}
