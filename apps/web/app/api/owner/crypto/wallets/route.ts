import { NextRequest, NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth/owner";
import { db as prisma } from "@/lib/db";
import { createPublicClient, http, formatEther } from "viem";
import { mainnet, base } from "viem/chains";

export const dynamic = "force-dynamic";

// Free public RPCs as fallbacks
const DEFAULT_ETH_RPC = "https://eth.llamarpc.com";
const DEFAULT_BASE_RPC = "https://base.llamarpc.com";

// GET /api/owner/crypto/wallets
// Returns wallet balances from blockchain
export async function GET(request: NextRequest) {
  try {
    const ctx = await requireOwner(request);

    const settings = await prisma.dashboardSettings.findUnique({
      where: { userId: ctx.owner.id },
    });

    if (!settings || !settings.mainWalletAddress) {
      return NextResponse.json({
        wallets: [],
        error: "No wallet addresses configured. Set them in Settings.",
      });
    }

    const ethRpc = settings.ethRpc || DEFAULT_ETH_RPC;
    const baseRpc = settings.baseRpc || DEFAULT_BASE_RPC;

    // Create clients
    const ethClient = createPublicClient({
      chain: mainnet,
      transport: http(ethRpc),
    });

    const baseClient = createPublicClient({
      chain: base,
      transport: http(baseRpc),
    });

    // Collect all wallet addresses
    const walletAddresses: { address: string; label: string }[] = [];

    if (settings.mainWalletAddress) {
      walletAddresses.push({
        address: settings.mainWalletAddress,
        label: "Main Wallet",
      });
    }

    try {
      const tracked = JSON.parse(settings.trackedWallets || "[]");
      for (const w of tracked) {
        if (w.address) {
          walletAddresses.push({
            address: w.address,
            label: w.label || "Tracked",
          });
        }
      }
    } catch {
      // Invalid JSON, ignore tracked wallets
    }

    // Query balances for each wallet on each chain
    const results = [];

    for (const wallet of walletAddresses) {
      // Validate address format (basic check)
      if (!wallet.address || wallet.address.length < 10) {
        continue;
      }

      const addr = wallet.address as `0x${string}`;
      const walletData: any = {
        address: wallet.address,
        label: wallet.label,
        chains: [],
      };

      // ETH mainnet balance
      try {
        const ethBalance = await ethClient.getBalance({ address: addr });
        walletData.chains.push({
          chain: "ethereum",
          symbol: "ETH",
          balance: formatEther(ethBalance),
          balanceRaw: ethBalance.toString(),
        });
      } catch (err: any) {
        walletData.chains.push({
          chain: "ethereum",
          symbol: "ETH",
          balance: "0",
          error: err.message?.slice(0, 100),
        });
      }

      // Base chain balance
      try {
        const baseBalance = await baseClient.getBalance({ address: addr });
        walletData.chains.push({
          chain: "base",
          symbol: "ETH",
          balance: formatEther(baseBalance),
          balanceRaw: baseBalance.toString(),
        });
      } catch (err: any) {
        walletData.chains.push({
          chain: "base",
          symbol: "ETH",
          balance: "0",
          error: err.message?.slice(0, 100),
        });
      }

      results.push(walletData);
    }

    return NextResponse.json({
      wallets: results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof NextResponse) {
      return error;
    }
    console.error("[/api/owner/crypto/wallets GET] Error:", error);
    return NextResponse.json({ error: "internal_server_error" }, { status: 500 });
  }
}
