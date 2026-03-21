/**
 * TX Verifier — Etherscan API V2
 *
 * Single API endpoint for all EVM chains:
 *   https://api.etherscan.io/v2/api?chainid={chainId}&...
 *
 * Chain IDs:
 *   ethereum = 1
 *   base     = 8453
 */

const CHAIN_IDS: Record<string, number> = {
  ethereum: 1,
  base: 8453,
};

export interface VerifyTxResult {
  verified: boolean;
  status: "success" | "failure" | "pending";
  blockNumber: number | null;
}

/**
 * Verify a transaction receipt status using Etherscan API V2.
 * Used to confirm on-chain transaction success before crediting airdrop claims.
 */
export async function verifyTx(
  txHash: string,
  chain: "ethereum" | "base" = "ethereum"
): Promise<VerifyTxResult> {
  const chainId = CHAIN_IDS[chain] ?? 1;
  const apiKey = process.env.ETHERSCAN_API_KEY ?? "";

  const url = new URL(
    `https://api.etherscan.io/v2/api?chainid=${chainId}&module=transaction&action=gettxreceiptstatus&txhash=${txHash}&apikey=${apiKey}`
  );

  try {
    const res = await fetch(url.toString());
    if (!res.ok) {
      console.error(`[tx-verify] Etherscan API error: ${res.status} ${res.statusText}`);
      return { verified: false, status: "pending", blockNumber: null };
    }

    const data = await res.json();

    // Etherscan V2 response shape:
    // { status: "1", message: "OK", result: { status: "1" (success) | "0" (failure) } }
    if (data.status !== "1" || !data.result) {
      return { verified: false, status: "pending", blockNumber: null };
    }

    const receiptStatus = data.result.status; // "1" = success, "0" = failure

    return {
      verified: receiptStatus === "1",
      status: receiptStatus === "1" ? "success" : "failure",
      blockNumber: null, // receipt endpoint doesn't return blockNumber; use gettxinfo if needed
    };
  } catch (err) {
    console.error(`[tx-verify] Exception for tx ${txHash}:`, err);
    return { verified: false, status: "pending", blockNumber: null };
  }
}



export function detectChain(name: string, token?: string): string {
  const lower = (name + " " + (token || "")).toLowerCase();
  if (lower.includes("base")) return "base";
  if (lower.includes("arb") || lower.includes("arbitrum")) return "arbitrum";
  if (lower.includes("op") || lower.includes("optimism")) return "optimism";
  if (lower.includes("polygon") || lower.includes("matic")) return "polygon";
  if (lower.includes("linea")) return "linea";
  if (lower.includes("zksync")) return "zksync";
  return "ethereum";
}
