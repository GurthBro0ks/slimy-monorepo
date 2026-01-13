"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DebugDock } from "@/components/owner/debug-dock";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface AuditLog {
  id: string;
  actorId: string;
  actor: {
    id: string;
    email: string;
  };
  action: string;
  resourceType: string;
  resourceId: string;
  changes?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

interface AuditLogsResponse {
  ok: boolean;
  logs: AuditLog[];
  count: number;
}

type FilterAction =
  | "ALL"
  | "INVITE_CREATE"
  | "INVITE_REVOKE"
  | "SETTINGS_UPDATE";

const ACTIONS: Record<FilterAction, string> = {
  ALL: "All Actions",
  INVITE_CREATE: "Create Invite",
  INVITE_REVOKE: "Revoke Invite",
  SETTINGS_UPDATE: "Update Settings",
};

export default function OwnerAuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAction, setSelectedAction] = useState<FilterAction>("ALL");
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load audit logs on mount and when filter changes
  useEffect(() => {
    loadLogs();
  }, [selectedAction]);

  async function loadLogs() {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        limit: "100",
      });

      if (selectedAction !== "ALL") {
        params.append("action", selectedAction);
      }

      const response = await fetch(
        `/api/owner/audit?${params.toString()}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!response.ok) {
        if (response.status === 403) {
          window.location.href = "/owner/forbidden";
          return;
        }
        if (response.status === 401) {
          window.location.href = "/";
          return;
        }
        throw new Error(`Failed to load audit logs: ${response.status}`);
      }

      const data = (await response.json()) as AuditLogsResponse;
      setLogs(data.logs || []);
      setLoading(false);
    } catch (err) {
      setError(String(err));
      setLoading(false);
    }
  }

  function getActionLabel(action: string): string {
    return (ACTIONS as Record<string, string>)[action] || action;
  }

  function getActionColor(action: string): string {
    switch (action) {
      case "INVITE_CREATE":
        return "text-green-400";
      case "INVITE_REVOKE":
        return "text-red-400";
      case "SETTINGS_UPDATE":
        return "text-blue-400";
      default:
        return "text-gray-400";
    }
  }

  function formatUserAgent(ua?: string): string {
    if (!ua) return "Unknown";
    // Extract browser info
    if (ua.includes("Chrome")) return "Chrome";
    if (ua.includes("Firefox")) return "Firefox";
    if (ua.includes("Safari")) return "Safari";
    if (ua.includes("Edge")) return "Edge";
    return "Unknown";
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-['Press Start 2P'] text-green-400 mb-2">
          AUDIT LOG
        </h1>
        <p className="text-gray-400 font-mono text-sm">
          System actions and administrative changes
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Action Filter */}
      <Card className="border-yellow-500/30 bg-black/30">
        <CardHeader>
          <CardTitle className="text-yellow-400 text-lg">Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(ACTIONS) as FilterAction[]).map((action) => (
              <Button
                key={action}
                onClick={() => setSelectedAction(action)}
                className={`text-xs ${
                  selectedAction === action
                    ? "bg-yellow-600 hover:bg-yellow-700 text-white"
                    : "bg-black/50 border border-yellow-500/30 text-yellow-300 hover:bg-yellow-500/10 hover:border-yellow-400"
                }`}
              >
                {ACTIONS[action]}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs List */}
      <Card className="border-cyan-500/30 bg-black/30">
        <CardHeader>
          <CardTitle className="text-cyan-400 text-lg">Logs</CardTitle>
          <CardDescription>
            {loading ? "Loading..." : `${logs.length} log${logs.length !== 1 ? "s" : ""}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading logs...</div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No logs found for this filter.
            </div>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="border border-cyan-500/20 rounded hover:bg-cyan-500/5 transition-colors"
                >
                  <button
                    onClick={() =>
                      setExpandedLogId(
                        expandedLogId === log.id ? null : log.id
                      )
                    }
                    className="w-full text-left p-4 flex items-center justify-between hover:bg-cyan-500/5"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-xs text-gray-500">
                          {new Date(log.createdAt).toLocaleDateString(
                            undefined,
                            {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                            }
                          )}
                        </span>
                        <span className={`text-xs font-bold ${getActionColor(log.action)}`}>
                          {getActionLabel(log.action)}
                        </span>
                        <span className="text-xs text-gray-600">
                          {log.resourceType}#{log.resourceId.substring(0, 8)}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        by {log.actor.email}
                        {log.ipAddress && ` · IP: ${log.ipAddress}`}
                        {log.userAgent && ` · ${formatUserAgent(log.userAgent)}`}
                      </div>
                    </div>
                    <div className="text-cyan-400 ml-2">
                      {expandedLogId === log.id ? "▼" : "▶"}
                    </div>
                  </button>

                  {/* Expanded Details */}
                  {expandedLogId === log.id && (
                    <div className="border-t border-cyan-500/10 p-4 bg-black/20 space-y-2">
                      {log.changes && Object.keys(log.changes).length > 0 ? (
                        <div>
                          <div className="text-xs font-bold text-cyan-300 mb-2">
                            Changes
                          </div>
                          <div className="space-y-1 font-mono text-xs text-cyan-200 bg-black/50 p-3 rounded border border-cyan-500/10">
                            {Object.entries(log.changes).map(
                              ([key, value]) => (
                                <div key={key}>
                                  <span className="text-cyan-400">{key}:</span>{" "}
                                  <span className="text-gray-400">
                                    {typeof value === "object"
                                      ? JSON.stringify(value, null, 2)
                                      : String(value)}
                                  </span>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-gray-500">
                          No additional changes recorded
                        </div>
                      )}

                      <div className="text-xs text-gray-600 space-y-1 pt-2">
                        {log.userAgent && (
                          <div>
                            <span className="text-gray-500">User Agent:</span>{" "}
                            {log.userAgent.substring(0, 100)}
                            {log.userAgent.length > 100 && "..."}
                          </div>
                        )}
                        <div>
                          <span className="text-gray-500">Log ID:</span>{" "}
                          {log.id}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Note */}
      <Card className="border-purple-500/30 bg-black/30">
        <CardHeader>
          <CardTitle className="text-purple-400 text-sm">
            About Audit Logs
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-gray-400 space-y-2">
          <p>
            All owner system actions are logged with timestamps, actor information, and change details.
          </p>
          <p>
            Sensitive data (like plaintext tokens) is automatically sanitized and not included in logs.
          </p>
          <p>
            Logs are retained for 90 days and can be used for security audits and troubleshooting.
          </p>
        </CardContent>
      </Card>

      {/* Debug Dock */}
      <DebugDock
        additionalInfo={{
          logsCount: logs.length,
          route: "/owner/audit",
        }}
      />
    </div>
  );
}
