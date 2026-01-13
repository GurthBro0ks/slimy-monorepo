"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DebugDock } from "@/components/owner/debug-dock";

interface OwnerMe {
  ok: boolean;
  user: {
    id: string;
    discordId: string;
    email?: string | null;
    globalName?: string | null;
  };
  owner: {
    id: string;
    email: string;
    userId?: string | null;
  };
  isOwner: boolean;
}

interface DashboardStats {
  invitesCount?: number;
  auditLogsCount?: number;
  lastActivityTime?: string;
}

export default function OwnerDashboardPage() {
  const [ownerInfo, setOwnerInfo] = useState<OwnerMe | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiLatency, setApiLatency] = useState<number | undefined>();

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        const startTime = performance.now();

        // Fetch owner info
        const response = await fetch("/api/owner/me", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        const latency = Math.round(performance.now() - startTime);
        setApiLatency(latency);

        if (!response.ok) {
          if (response.status === 403) {
            window.location.href = "/owner/forbidden";
          } else if (response.status === 401) {
            window.location.href = "/";
          }
          return;
        }

        const data = (await response.json()) as OwnerMe;
        setOwnerInfo(data);

        // Try to load some stats (optional)
        try {
          const invitesRes = await fetch("/api/owner/invites?limit=1", {
            method: "GET",
          });
          if (invitesRes.ok) {
            const invitesData = await invitesRes.json();
            setStats((prev) => ({
              ...prev,
              invitesCount: Array.isArray(invitesData.invites)
                ? invitesData.invites.length
                : 0,
            }));
          }
        } catch {
          // Silently fail
        }

        setLoading(false);
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  const currentTime = new Date().toISOString();
  const buildVersion = process.env.NEXT_PUBLIC_BUILD_VERSION || "unknown";
  const buildCommit = process.env.NEXT_PUBLIC_BUILD_COMMIT || "unknown";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-['Press Start 2P'] text-green-400 mb-2">
          OWNER PANEL
        </h1>
        <p className="text-gray-400 font-mono text-sm">
          System administration and control interface
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center space-y-4">
            <div className="text-6xl animate-pulse">⊙</div>
            <p className="text-gray-400 font-mono">Loading owner data...</p>
          </div>
        </div>
      ) : ownerInfo ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Owner Identity Card */}
          <Card className="border-purple-500/30 bg-black/30">
            <CardHeader>
              <CardTitle className="text-green-400 text-lg">
                Owner Identity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">
                  Owner Email
                </p>
                <p className="text-base font-mono text-purple-300">
                  {ownerInfo.owner.email}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">
                  User Email
                </p>
                <p className="text-base font-mono text-purple-300">
                  {ownerInfo.user.email || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">
                  Discord Name
                </p>
                <p className="text-base font-mono text-purple-300">
                  {ownerInfo.user.globalName || ownerInfo.user.discordId}
                </p>
              </div>
              <div className="pt-2 border-t border-purple-500/20">
                <p className="text-xs text-gray-600">
                  Status: <span className="text-green-400">✓ OWNER</span>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* System Info Card */}
          <Card className="border-blue-500/30 bg-black/30">
            <CardHeader>
              <CardTitle className="text-blue-400 text-lg">
                System Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">
                  Build Version
                </p>
                <p className="text-base font-mono text-blue-300">
                  {buildVersion}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">
                  Build Commit
                </p>
                <p className="text-base font-mono text-blue-300 break-all">
                  {buildCommit.substring(0, 12)}
                </p>
              </div>
              {apiLatency !== undefined && (
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">
                    API Latency
                  </p>
                  <p className="text-base font-mono text-blue-300">
                    {apiLatency}ms
                  </p>
                </div>
              )}
              <div className="pt-2 border-t border-blue-500/20">
                <p className="text-xs text-gray-600">
                  Current Time: {new Date(currentTime).toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Links Card */}
          <Card className="border-yellow-500/30 bg-black/30 md:col-span-2">
            <CardHeader>
              <CardTitle className="text-yellow-400 text-lg">
                Quick Actions
              </CardTitle>
              <CardDescription>
                Navigate to management sections
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link
                  href="/owner/invites"
                  className="p-4 border border-yellow-500/30 rounded hover:bg-yellow-500/10 hover:border-yellow-400 transition-all group"
                >
                  <div className="text-sm font-bold text-yellow-400 group-hover:text-yellow-300">
                    INVITE MANAGEMENT
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    Create and revoke owner invites
                  </div>
                  {stats?.invitesCount !== undefined && (
                    <div className="text-xs text-yellow-600 mt-2">
                      {stats.invitesCount} active invites
                    </div>
                  )}
                </Link>

                <Link
                  href="/owner/settings"
                  className="p-4 border border-yellow-500/30 rounded hover:bg-yellow-500/10 hover:border-yellow-400 transition-all group"
                >
                  <div className="text-sm font-bold text-yellow-400 group-hover:text-yellow-300">
                    SYSTEM SETTINGS
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    Configure app behavior and features
                  </div>
                </Link>

                <Link
                  href="/owner/audit"
                  className="p-4 border border-yellow-500/30 rounded hover:bg-yellow-500/10 hover:border-yellow-400 transition-all group"
                >
                  <div className="text-sm font-bold text-yellow-400 group-hover:text-yellow-300">
                    AUDIT LOG
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    Review system actions and changes
                  </div>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center space-y-4">
            <div className="text-6xl text-red-500">⚠</div>
            <p className="text-gray-400 font-mono">
              Failed to load owner data. Please refresh.
            </p>
          </div>
        </div>
      )}

      {/* Debug Dock */}
      <DebugDock
        isOwner={ownerInfo?.isOwner}
        userEmail={ownerInfo?.user.email}
        ownerEmail={ownerInfo?.owner.email}
        buildInfo={{
          version: buildVersion,
          commit: buildCommit,
        }}
        apiLatency={apiLatency}
        additionalInfo={{
          timestamp: currentTime,
          route: "/owner",
        }}
      />
    </div>
  );
}
