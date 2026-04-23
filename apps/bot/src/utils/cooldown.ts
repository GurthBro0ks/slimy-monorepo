const COMMAND_COOLDOWNS: Record<string, number> = {
  "club-analyze": 60,
  "club-push": 60,
  "club-export": 30,
};

const DEFAULT_COOLDOWN_SECONDS = 10;

const BOT_OWNER_ID = process.env.OWNER_ID || process.env.BOT_OWNER_ID || "";

type UserCooldownMap = Map<string, number>;
const cooldownStore = new Map<string, UserCooldownMap>();

function getCooldownSeconds(commandName: string): number {
  return COMMAND_COOLDOWNS[commandName] ?? DEFAULT_COOLDOWN_SECONDS;
}

function checkCooldown(
  commandName: string,
  userId: string,
  cooldownSeconds?: number,
): number {
  if (BOT_OWNER_ID && userId === BOT_OWNER_ID) return 0;

  const seconds = cooldownSeconds ?? getCooldownSeconds(commandName);
  const now = Date.now();

  let userMap = cooldownStore.get(commandName);
  if (!userMap) {
    userMap = new Map();
    cooldownStore.set(commandName, userMap);
  }

  const lastUsed = userMap.get(userId);
  if (lastUsed) {
    const elapsed = (now - lastUsed) / 1000;
    const remaining = seconds - elapsed;
    if (remaining > 0) {
      return Math.ceil(remaining);
    }
  }

  userMap.set(userId, now);
  return 0;
}

function cleanupExpired(): void {
  const now = Date.now();
  for (const [commandName, userMap] of cooldownStore.entries()) {
    const seconds = getCooldownSeconds(commandName);
    for (const [userId, lastUsed] of userMap.entries()) {
      if (now - lastUsed > seconds * 1000) {
        userMap.delete(userId);
      }
    }
    if (userMap.size === 0) {
      cooldownStore.delete(commandName);
    }
  }
}

setInterval(cleanupExpired, 5 * 60 * 1000);

export { checkCooldown, getCooldownSeconds, COMMAND_COOLDOWNS, DEFAULT_COOLDOWN_SECONDS };
