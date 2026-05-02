import { NextRequest, NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth/owner";
import { db as prisma } from "@/lib/db";
import { createPublicClient, http, formatEther } from "viem";
import { mainnet, base } from "viem/chains";

// Free public RPCs as fallbacks
const DEFAULT_ETH_RPC = "https://cloudflare-eth.com";
const DEFAULT_BASE_RPC = "https://base.llamarpc.com";

// ERC-20 token addresses
const ETH_TOKENS = {
  USDC: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  USDT: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
  DAI: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
  WETH: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
};

const BASE_TOKENS = {
  USDC: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  WETH: "0x4200000000000000000000000000000000000006",
};

const ERC20_ABI = [
  {
    name: "balanceOf",
    type: "function",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    name: "symbol",
    type: "function",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
  },
  {
    name: "decimals",
    type: "function",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
  },
] as const;

// Simple in-memory price cache (CoinGecko free tier)
interface PriceCache {
  prices: Record<string, number>;
  timestamp: number;
}
const PRICE_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
let priceCache: PriceCache | null = null;

async function getTokenPrices(): Promise<Record<string, number>> {
  // Return cached prices if still valid
  if (priceCache && Date.now() - priceCache.timestamp < PRICE_CACHE_TTL) {
    return priceCache.prices;
  }

  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=ethereum,usd-coin,tether,dai,weth&vs_currencies=usd",
      { signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) throw new Error(`CoinGecko ${res.status}`);
    const data = await res.json();

    const prices: Record<string, number> = {
      ETH: data.ethereum?.usd ?? 0,
      WETH: data.weth?.usd ?? data.ethereum?.usd ?? 0,
      USDC: data["usd-coin"]?.usd ?? 1.0,
      USDT: data.tether?.usd ?? 1.0,
      DAI: data.dai?.usd ?? 1.0,
    };

    priceCache = { prices, timestamp: Date.now() };
    return prices;
  } catch {
    // Fallback prices if CoinGecko is down
    return {
      ETH: 0,
      WETH: 0,
      USDC: 1.0,
      USDT: 1.0,
      DAI: 1.0,
    };
  }
}

async function queryTokenBalance(
  client: any,
  tokenAddress: `0x${string}`,
  walletAddress: `0x${string}`,
  decimals: number
): Promise<{ balance: string; symbol: string }> {
  try {
    const [balance, symbol] = await Promise.all([
      client.readContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: [walletAddress],
      }),
      client.readContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: "symbol",
        args: [],
      }),
    ]);
    const adjusted = Number(balance) / Math.pow(10, decimals);
    return { balance: adjusted.toFixed(decimals > 6 ? 4 : 2), symbol };
  } catch {
    return { balance: "0", symbol: "?" };
  }
}

// GET /api/owner/crypto/holdings
export async function GET(request: NextRequest) {
  try {
    const ctx = await requireOwner(request);

    const settings = await prisma.dashboardSettings.findUnique({
      where: { userId: ctx.owner.id },
    });

    if (!settings || !settings.mainWalletAddress) {
      return NextResponse.json({ wallets: [], error: "No wallets configured" });
    }

    const ethRpc = settings.ethRpc || DEFAULT_ETH_RPC;
    const baseRpc = settings.baseRpc || DEFAULT_BASE_RPC;

    const ethClient = createPublicClient({ chain: mainnet, transport: http(ethRpc) });
    const baseClient = createPublicClient({ chain: base, transport: http(baseRpc) });

    // Collect wallet addresses
    const wallets: { address: string; label: string }[] = [
      { address: settings.mainWalletAddress, label: "Main Wallet" },
    ];

    try {
      const tracked = JSON.parse(settings.trackedWallets || "[]");
      for (const w of tracked) {
        if (w.address) wallets.push({ address: w.address, label: w.label || "Tracked" });
      }
    } catch { /* ignore */ }

    const prices = await getTokenPrices();
    const result = [];

    for (const wallet of wallets) {
      const addr = wallet.address as `0x${string}`;

      // --- Ethereum ---
      const ethWalletData: any = {
        address: wallet.address,
        label: wallet.label,
        chain: "ethereum",
        native: { balance: "0", usd: 0 },
        tokens: [],
      };

      try {
        const ethBal = await ethClient.getBalance({ address: addr });
        const ethBalance = parseFloat(formatEther(ethBal));
        ethWalletData.native = {
          balance: ethBalance.toFixed(4),
          usd: ethBalance * prices.ETH,
        };
      } catch { /* RPC may fail, native stays 0 */ }

      // ETH chain tokens
      for (const [symbol, tokenAddr] of Object.entries(ETH_TOKENS)) {
        if (symbol === "ETH" || symbol === "WETH") continue; // skip native/WETH handled separately
        const tokenData = await queryTokenBalance(ethClient, tokenAddr as `0x${string}`, addr, symbol === "USDC" || symbol === "USDT" || symbol === "DAI" ? 6 : 18);
        if (parseFloat(tokenData.balance) > 0) {
          const priceKey = symbol === "USDC" ? "USDC" : symbol === "USDT" ? "USDT" : symbol === "DAI" ? "DAI" : "ETH";
          ethWalletData.tokens.push({
            symbol,
            balance: tokenData.balance,
            usd: parseFloat(tokenData.balance) * (prices[priceKey] ?? 0),
          });
        }
      }

      // Add WETH
      try {
        const wethBal = await ethClient.readContract({
          address: ETH_TOKENS.WETH as `0x${string}`,
          abi: ERC20_ABI,
          functionName: "balanceOf",
          args: [addr],
        });
        const wethBalance = Number(wethBal) / 1e18;
        if (wethBalance > 0) {
          ethWalletData.tokens.push({
            symbol: "WETH",
            balance: wethBalance.toFixed(4),
            usd: wethBalance * (prices.WETH ?? prices.ETH),
          });
        }
      } catch { /* ignore */ }

      // --- Base ---
      const baseWalletData: any = {
        address: wallet.address,
        label: wallet.label,
        chain: "base",
        native: { balance: "0", usd: 0 },
        tokens: [],
      };

      try {
        const baseBal = await baseClient.getBalance({ address: addr });
        const baseBalance = parseFloat(formatEther(baseBal));
        baseWalletData.native = {
          balance: baseBalance.toFixed(4),
          usd: baseBalance * prices.ETH, // ETH priced on mainnet
        };
      } catch { /* RPC may fail */ }

      // Base tokens
      for (const [symbol, tokenAddr] of Object.entries(BASE_TOKENS)) {
        if (symbol === "WETH") continue;
        const tokenData = await queryTokenBalance(baseClient, tokenAddr as `0x${string}`, addr, symbol === "USDC" ? 6 : 18);
        if (parseFloat(tokenData.balance) > 0) {
          const priceKey = symbol === "USDC" ? "USDC" : "ETH";
          baseWalletData.tokens.push({
            symbol,
            balance: tokenData.balance,
            usd: parseFloat(tokenData.balance) * (prices[priceKey] ?? 0),
          });
        }
      }

      // Add Base WETH
      try {
        const wethBal = await baseClient.readContract({
          address: BASE_TOKENS.WETH as `0x${string}`,
          abi: ERC20_ABI,
          functionName: "balanceOf",
          args: [addr],
        });
        const wethBalance = Number(wethBal) / 1e18;
        if (wethBalance > 0) {
          baseWalletData.tokens.push({
            symbol: "WETH",
            balance: wethBalance.toFixed(4),
            usd: wethBalance * (prices.WETH ?? prices.ETH),
          });
        }
      } catch { /* ignore */ }

      result.push(ethWalletData);
      result.push(baseWalletData);
    }

    return NextResponse.json({
      wallets: result,
      prices,
      fetchedAt: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof NextResponse) return error;
    console.error("[/api/owner/crypto/holdings GET] Error:", error);
    return NextResponse.json({ error: "internal_server_error" }, { status: 500 });
  }
}
