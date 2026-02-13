// Chat Settings Page - Invite Code Based Access Control
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

type Tab = "admin" | "owner";

interface ChatUser {
  id: string;
  username: string;
  role: "owner" | "admin" | "user";
}

interface Stats {
  adminInvitesCount?: number;
  userInvitesCount?: number;
}

export default function ChatSettingsPage() {
  const [chatUser, setChatUser] = useState<ChatUser | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("admin");

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        // Check chat session
        const chatRes = await fetch("/api/chat/auth/me", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (!chatRes.ok) {
          window.location.href = "/chat?login=true";
          return;
        }

        const user = (await chatRes.json()) as ChatUser;
        setChatUser(user);

        // Set default tab based on role
        if (user.role === "owner") {
          setActiveTab("owner");
        }

        // Load stats in background
        try {
          const adminRes = await fetch("/api/admin/invites");
          if (adminRes.ok) {
            const data = await adminRes.json();
            setStats((prev) => ({
              ...prev,
              adminInvitesCount: data.count || 0,
            }));
          }
        } catch {
          // Silently fail
        }

        try {
          const userRes = await fetch("/api/admin/chat-invites/count");
          if (userRes.ok) {
            const data = await userRes.json();
            setStats((prev) => ({
              ...prev,
              userInvitesCount: data.count || 0,
            }));
          }
        } catch {
          // Silently fail
        }
      } catch (error) {
        console.error("Failed to load data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const isOwner = chatUser?.role === "owner";
  const isAdmin = chatUser?.role === "admin" || isOwner;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-['Press Start 2P'] text-green-400 mb-2">
            CHAT SETTINGS
          </h1>
          <p className="text-gray-400 font-mono text-sm">
            Invite code access control
          </p>
        </div>
        <Link
          href="/chat"
          className="px-4 py-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 rounded font-mono text-sm hover:bg-emerald-500/30"
        >
          ← Back to Chat
        </Link>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-gray-700 pb-2">
        {isAdmin && (
          <button
            onClick={() => setActiveTab("admin")}
            className={`px-4 py-2 rounded font-mono text-sm transition-colors ${
              activeTab === "admin"
                ? "bg-blue-500/20 text-blue-400 border border-blue-500/50"
                : "text-gray-400 hover:text-gray-200 hover:bg-gray-800"
            }`}
          >
            ⚙ User Invites
          </button>
        )}
        {isOwner && (
          <button
            onClick={() => setActiveTab("owner")}
            className={`px-4 py-2 rounded font-mono text-sm transition-colors ${
              activeTab === "owner"
                ? "bg-purple-500/20 text-purple-400 border border-purple-500/50"
                : "text-gray-400 hover:text-gray-200 hover:bg-gray-800"
            }`}
          >
            👑 Admin Invites
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center space-y-4">
            <div className="text-6xl animate-pulse">⊙</div>
            <p className="text-gray-400 font-mono">Loading settings...</p>
          </div>
        </div>
      ) : chatUser ? (
        <>
          {/* User Info Card */}
          <Card className="border-emerald-500/30 bg-black/30">
            <CardHeader>
              <CardTitle className="text-emerald-400 text-lg">
                Your Access Level
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">
                  Username
                </p>
                <p className="text-base font-mono text-emerald-300">
                  {chatUser.username}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">
                  Role
                </p>
                <p className="text-base font-mono">
                  {chatUser.role === "owner" && (
                    <span className="text-purple-400">👑 OWNER</span>
                  )}
                  {chatUser.role === "admin" && (
                    <span className="text-blue-400">⚙ ADMIN</span>
                  )}
                  {chatUser.role === "user" && (
                    <span className="text-gray-400">👤 USER</span>
                  )}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* ADMIN TAB - Create User Invites */}
          {activeTab === "admin" && isAdmin && (
            <div className="space-y-6">
              <Card className="border-cyan-500/30 bg-black/30">
                <CardHeader>
                  <CardTitle className="text-cyan-400 text-lg">
                    User Invite Codes
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Create codes for new chat users
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <UserInviteManager
                    count={stats?.userInvitesCount}
                    allowRevoke={isOwner}
                  />
                </CardContent>
              </Card>

              <Card className="border-yellow-500/30 bg-black/30">
                <CardHeader>
                  <CardTitle className="text-yellow-400 text-lg">
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Link
                      href="/chat"
                      className="p-4 border border-yellow-500/30 rounded hover:bg-yellow-500/10 hover:border-yellow-400 transition-all group"
                    >
                      <div className="text-sm font-bold text-yellow-400 group-hover:text-yellow-300">
                        RETURN TO CHAT
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        Back to messaging
                      </div>
                    </Link>
                    <Link
                      href="/dashboard"
                      className="p-4 border border-yellow-500/30 rounded hover:bg-yellow-500/10 hover:border-yellow-400 transition-all group"
                    >
                      <div className="text-sm font-bold text-yellow-400 group-hover:text-yellow-300">
                        DASHBOARD
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        Main dashboard
                      </div>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* OWNER TAB - Create Admin Invites */}
          {activeTab === "owner" && isOwner && (
            <div className="space-y-6">
              {/* Admin Invite Generator */}
              <Card className="border-red-500/30 bg-black/30">
                <CardHeader>
                  <CardTitle className="text-red-400 text-lg">
                    Admin Invite Codes
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Create codes that grant admin status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AdminInviteManager count={stats?.adminInvitesCount} />
                </CardContent>
              </Card>

              {/* User Invite Generator (Owner can also create) */}
              <Card className="border-cyan-500/30 bg-black/30">
                <CardHeader>
                  <CardTitle className="text-cyan-400 text-lg">
                    User Invite Codes
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Create codes for new chat users
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <UserInviteManager
                    count={stats?.userInvitesCount}
                    allowRevoke
                  />
                </CardContent>
              </Card>

              {/* Owner Actions */}
              <Card className="border-yellow-500/30 bg-black/30">
                <CardHeader>
                  <CardTitle className="text-yellow-400 text-lg">
                    Owner Actions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Link
                      href="/dashboard"
                      className="p-4 border border-yellow-500/30 rounded hover:bg-yellow-500/10 hover:border-yellow-400 transition-all group"
                    >
                      <div className="text-sm font-bold text-yellow-400 group-hover:text-yellow-300">
                        DASHBOARD
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        Main dashboard
                      </div>
                    </Link>
                    <Link
                      href="/chat"
                      className="p-4 border border-yellow-500/30 rounded hover:bg-yellow-500/10 hover:border-yellow-400 transition-all group"
                    >
                      <div className="text-sm font-bold text-yellow-400 group-hover:text-yellow-300">
                        BACK TO CHAT
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        Return to chat
                      </div>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      ) : (
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center space-y-4">
            <div className="text-6xl text-red-500">⚠</div>
            <p className="text-gray-400 font-mono">
              Failed to load settings
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// User Invite Manager - Creates regular user invites
function UserInviteManager({
  count,
  allowRevoke = false,
}: {
  count?: number;
  allowRevoke?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    code?: string;
    error?: string;
  } | null>(null);
  const [revoked, setRevoked] = useState(false);

  const createInvite = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/chat-invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (res.ok) {
        setResult({ code: data.code });
        setRevoked(false);
      } else {
        setResult({ error: data.error || "Failed to create invite" });
      }
    } catch {
      setResult({ error: "Network error" });
    } finally {
      setLoading(false);
    }
  };

  const revokeAll = async () => {
    if (!confirm("Revoke ALL user invite codes?")) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/chat-invites", {
        method: "DELETE",
      });
      if (res.ok) {
        setRevoked(true);
        setResult(null);
      }
    } catch {
      setResult({ error: "Failed to revoke" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-400">
          Active codes: <span className="text-cyan-400">{count || 0}</span>
        </div>
        {allowRevoke && (
          <button
            onClick={revokeAll}
            disabled={loading || (count || 0) === 0}
            className="px-3 py-1 text-xs bg-red-500/20 text-red-400 border border-red-500/50 rounded hover:bg-red-500/30 disabled:opacity-50"
          >
            Revoke All
          </button>
        )}
      </div>

      <button
        onClick={createInvite}
        disabled={loading}
        className="w-full py-3 bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 rounded hover:bg-cyan-500/30 font-mono text-sm disabled:opacity-50"
      >
        {loading ? "Creating..." : "+ Generate User Invite Code"}
      </button>

      {result?.code && (
        <div className="p-4 bg-cyan-500/10 border border-cyan-500/30 rounded">
          <p className="text-xs text-gray-400 mb-2">New user invite code:</p>
          <code className="text-lg text-cyan-300 font-mono select-all">
            {result.code}
          </code>
          <p className="text-xs text-gray-500 mt-2">
            Grants: User role
          </p>
        </div>
      )}

      {result?.error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded text-red-400 text-sm">
          {result.error}
        </div>
      )}

      {revoked && (
        <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded text-yellow-400 text-sm">
          All user invite codes revoked
        </div>
      )}
    </div>
  );
}

// Admin Invite Manager - Creates admin invites (Owner only)
function AdminInviteManager({ count }: { count?: number }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    code?: string;
    error?: string;
  } | null>(null);

  const createInvite = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (res.ok) {
        setResult({ code: data.code });
      } else {
        setResult({ error: data.error || "Failed to create admin invite" });
      }
    } catch {
      setResult({ error: "Network error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-400">
        Active admin codes: <span className="text-red-400">{count || 0}</span>
      </div>

      <button
        onClick={createInvite}
        disabled={loading}
        className="w-full py-3 bg-red-500/20 text-red-400 border border-red-500/50 rounded hover:bg-red-500/30 font-mono text-sm disabled:opacity-50"
      >
        {loading ? "Creating..." : "+ Generate Admin Invite Code"}
      </button>

      {result?.code && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded">
          <p className="text-xs text-gray-400 mb-2">New admin invite code:</p>
          <code className="text-lg text-red-300 font-mono select-all">
            {result.code}
          </code>
          <p className="text-xs text-gray-500 mt-2">
            Grants: Admin role
          </p>
        </div>
      )}

      {result?.error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded text-red-400 text-sm">
          {result.error}
        </div>
      )}
    </div>
  );
}
