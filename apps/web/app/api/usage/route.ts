import { getMockUsageData } from "@/lib/usage-thresholds";
import { apiHandler } from "@/lib/api/handler";

export const runtime = "edge";
export const revalidate = 30; // Revalidate every 30 seconds

/**
 * GET /api/usage
 * Returns current user usage data (mocked for now)
 */
export const GET = apiHandler(async () => {
  const mockSpend = 950;
  const usageData = getMockUsageData(mockSpend);

  return { body: { ok: true, data: usageData } };
});
