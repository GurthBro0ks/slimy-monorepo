import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// Map task names to bot action keys
// These must match the action identifiers in the bot farming log
const TASK_BOT_MAPPINGS: Record<string, string[]> = {
  // Bot action key → array of task name substrings to match
  "swap_aerodrome": ["Swap on Aerodrome", "aerodrome"],
  "swap_uniswap": ["Swap via", "uniswap"],
  "nft_mint": ["Mint NFT on Base", "Mint NFT", "nft mint", "zora"],
  "aave_deposit": ["Provide LP on Aerodrome", "aave", "deposit", "Provide LP"],
  "bridge_stargate": ["Bridge via Stargate", "stargate"],
  "bridge_base": ["Bridge USDC to Base", "Bridge", "bridge usdc"],
  "metamask_swap": ["Swap via MetaMask", "metamask swap"],
  "metamask_bridge": ["Bridge via MetaMask", "metamask bridge"],
  "opensea_list": ["List NFT on OpenSea", "opensea list", "list nft"],
  "opensea_buy": ["Buy NFT on OpenSea", "buy nft"],
};

async function main() {
  const tasks = await prisma.airdropTask.findMany({
    include: { airdrop: { select: { protocol: true } } },
  });

  console.log(`Found ${tasks.length} tasks`);

  for (const task of tasks) {
    // Skip if already has a key
    if (task.botActionKey) {
      console.log(`  Skip: ${task.name} (already has key: ${task.botActionKey})`);
      continue;
    }

    // Try to find a matching bot action key
    let matchedKey: string | null = null;

    for (const [botKey, patterns] of Object.entries(TASK_BOT_MAPPINGS)) {
      const taskNameLower = task.name.toLowerCase();
      const matched = patterns.some(p => taskNameLower.includes(p.toLowerCase()));
      if (matched) {
        matchedKey = botKey;
        break;
      }
    }

    if (matchedKey) {
      await prisma.airdropTask.update({
        where: { id: task.id },
        data: { botActionKey: matchedKey },
      });
      console.log(`  Mapped: "${task.name}" (${task.airdrop.protocol}) → ${matchedKey}`);
    } else {
      console.log(`  No match: "${task.name}" (${task.airdrop.protocol})`);
    }
  }

  console.log("Done.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());