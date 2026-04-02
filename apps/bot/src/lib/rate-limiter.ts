/**
 * Rate limiting system for command cooldowns.
 * Ported from /opt/slimy/app/lib/rate-limiter.js
 */

interface CooldownEntry {
  expiry: number;
}

const cooldowns = new Map<string, CooldownEntry>();

// Cleanup old cooldowns every 5 minutes
setInterval(
  () => {
    const now = Date.now();
    for (const [key, entry] of cooldowns.entries()) {
      if (now > entry.expiry) {
        cooldowns.delete(key);
      }
    }
  },
  5 * 60 * 1000,
);

function checkCooldown(
  userId: string,
  commandName: string,
  cooldownSeconds = 3,
): { limited: boolean; remaining?: number } {
  const key = `${userId}-${commandName}`;
  const now = Date.now();
  const entry = cooldowns.get(key);

  if (entry && now < entry.expiry) {
    const remaining = ((entry.expiry - now) / 1000).toFixed(1);
    return { limited: true, remaining: Number(remaining) };
  }

  cooldowns.set(key, { expiry: now + cooldownSeconds * 1000 });
  return { limited: false };
}

function checkGlobalCooldown(
  userId: string,
  cooldownSeconds = 1,
): { limited: boolean; remaining?: number } {
  return checkCooldown(userId, "__global__", cooldownSeconds);
}

function resetCooldown(userId: string, commandName?: string | null): void {
  if (commandName) {
    const key = `${userId}-${commandName}`;
    cooldowns.delete(key);
  } else {
    // Clear all cooldowns for this user
    for (const key of cooldowns.keys()) {
      if (key.startsWith(`${userId}-`)) {
        cooldowns.delete(key);
      }
    }
  }
}

export const rateLimiter = {
  checkCooldown,
  checkGlobalCooldown,
  resetCooldown,
};

export default rateLimiter;
