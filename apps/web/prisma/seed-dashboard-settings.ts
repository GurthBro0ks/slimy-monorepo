import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Find the owner user by email
  const owner = await prisma.slimyUser.findUnique({
    where: { email: "gurth@slimyai.xyz" },
  });

  if (!owner) {
    console.error("Owner user not found with email: gurth@slimyai.xyz");
    process.exit(1);
  }

  console.log("Found owner user:", owner.id, owner.email);

  // Check if settings already exist
  const existing = await prisma.dashboardSettings.findUnique({
    where: { userId: owner.id },
  });

  if (existing) {
    console.log("Settings already exist, skipping seed");
    return;
  }

  // Seed with default values matching MOCK.settings
  const settings = await prisma.dashboardSettings.create({
    data: {
      userId: owner.id,
      kellyFraction: 0.20,
      maxPositionPct: 0.05,
      minEdge: 0.05,
      maxDrawdown: 0.30,
      maxConcurrent: 10,
      minPositionUsd: 1.00,
      farmingBudget: 5.00,
      farmingMode: "dry_run",
      cronInterval: "*/10 * * * *",
      ethRpc: "https://rpc.ankr.com/eth",
      baseRpc: "https://mainnet.base.org",
      // Wallet addresses - real values
      mainWalletAddress: "0xea845110a8e8fae57c5e7fbe3459dbb7675878a8",
      trackedWallets: JSON.stringify([
        { address: "0x2589Dfb54a", label: "Farming #1" },
      ]),
    },
  });

  console.log("Dashboard settings seeded:", settings.id);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
