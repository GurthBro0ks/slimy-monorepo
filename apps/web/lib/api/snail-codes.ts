/**
 * Snail Codes API Client
 * Provides active snail codes from various sources
 * Supports sandbox mode when admin-api is not configured
 */

export interface SnailCode {
  code: string;
  source: string;
  notes?: string;
  expiresAt?: string;
  active: boolean;
  createdAt: string;
}

// Sandbox data
const SANDBOX_CODES: SnailCode[] = [
  {
    code: "SLIMY2024",
    source: "Reddit",
    notes: "Monthly code - diamonds and resources",
    active: true,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    code: "SUPERSNAIL",
    source: "Snelp",
    notes: "Weekly code - experience boost",
    active: true,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    code: "GREENSLIME",
    source: "Discord",
    notes: "Event code - special items",
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    code: "OLDCODE123",
    source: "Reddit",
    notes: "Expired code",
    active: false,
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
  },
];

/**
 * Get all snail codes
 */
export async function getSnailCodes(): Promise<SnailCode[]> {
  const adminApiBase = process.env.NEXT_PUBLIC_ADMIN_API_BASE;

  if (!adminApiBase) {
    return Promise.resolve(SANDBOX_CODES);
  }

  try {
    const response = await fetch(`${adminApiBase}/api/snail/codes`, {
      credentials: "include",
    });

    if (!response.ok) {
      console.warn("Snail codes fetch failed, using sandbox data");
      return SANDBOX_CODES;
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to fetch snail codes:", error);
    return SANDBOX_CODES;
  }
}

/**
 * Get only active snail codes
 */
export async function getActiveSnailCodes(): Promise<SnailCode[]> {
  const codes = await getSnailCodes();
  return codes.filter((code) => code.active);
}
