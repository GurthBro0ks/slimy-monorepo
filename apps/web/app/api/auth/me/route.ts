import { apiClient } from "@/lib/api-client";
import { apiHandler } from "@/lib/api/handler";
import { getUserRole } from "@/slimy.config";

export const dynamic = "force-dynamic"; // no-store

interface AdminApiMeResponse {
  user: {
    id: string;
    name: string;
  };
  guilds?: Array<{
    id: string;
    roles: string[];
  }>;
}

export const GET = apiHandler(async () => {
  const result = await apiClient.getOrThrow<AdminApiMeResponse>("/api/auth/me", {
    useCache: false, // Don't cache auth data
  });

  const allRoles = result.data.guilds?.flatMap(g => g.roles) || [];
  const role = getUserRole(allRoles);

  return {
    body: {
      user: result.data.user,
      role,
      guilds: result.data.guilds,
    },
  };
});
