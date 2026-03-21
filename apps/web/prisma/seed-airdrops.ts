import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Clear existing airdrop data (safe since this is first run)
  await prisma.airdropCompletion.deleteMany();
  await prisma.airdropTask.deleteMany();
  await prisma.airdrop.deleteMany();

  const airdrops = [
    {
      protocol: "Base",
      token: "$BASE",
      tier: "S",
      status: "EXPLORING",
      frequency: "daily",
      notes: "Base ecosystem farming — bridge, swap, LP",
      tasks: [
        { name: "Bridge USDC to Base", frequency: "weekly" },
        { name: "Swap on Aerodrome", frequency: "daily" },
        { name: "Provide LP on Aerodrome", frequency: "weekly" },
        { name: "Mint NFT on Base", frequency: "weekly" },
      ],
    },
    {
      protocol: "OpenSea",
      token: "$SEA",
      tier: "S",
      status: "CONFIRMED",
      frequency: "daily",
      notes: "OpenSea token confirmed — volume and listing activity",
      tasks: [
        { name: "List NFT on OpenSea", frequency: "daily" },
        { name: "Buy NFT on OpenSea", frequency: "weekly" },
        { name: "Make collection offer", frequency: "weekly" },
      ],
    },
    {
      protocol: "MetaMask",
      token: "$MASK",
      tier: "S",
      status: "CONFIRMED",
      frequency: "daily",
      notes: "MetaMask token confirmed — swap and bridge via MM",
      tasks: [
        { name: "Swap via MetaMask", frequency: "daily" },
        { name: "Bridge via MetaMask", frequency: "weekly" },
        { name: "Use MetaMask Portfolio", frequency: "weekly" },
      ],
    },
    {
      protocol: "Ethena",
      token: "$ENA",
      tier: "A",
      status: "SEASON 5",
      frequency: "weekly",
      notes: "Season 5 sats farming — USDe staking",
      tasks: [
        { name: "Stake USDe on Ethena", frequency: "weekly" },
        { name: "Hold sUSDe position", frequency: "daily" },
      ],
    },
    {
      protocol: "LayerZero",
      token: "$ZRO",
      tier: "A",
      status: "SEASON 2",
      frequency: "weekly",
      notes: "Season 2 — cross-chain messaging and bridging",
      tasks: [
        { name: "Bridge via Stargate", frequency: "weekly" },
        { name: "Use LayerZero messaging", frequency: "biweekly" },
      ],
    },
  ];

  for (const { tasks, ...airdropData } of airdrops) {
    const airdrop = await prisma.airdrop.create({ data: airdropData });
    console.log(`Created airdrop: ${airdrop.protocol} (${airdrop.id})`);

    for (const taskData of tasks) {
      const task = await prisma.airdropTask.create({
        data: { ...taskData, airdropId: airdrop.id },
      });
      console.log(`  Task: ${task.name} (${task.id})`);
    }
  }

  console.log("Seed complete.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
