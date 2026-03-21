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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface OwnerInvite {
  id: string;
  codeHash: string;
  code?: string; // plaintext code for viewing
  createdAt: string;
  expiresAt: string | null;
  maxUses: number;
  useCount: number;
  revokedAt: string | null;
  note?: string;
  role: string;
  createdBy: {
    id: string;
    email: string;
  };
}

interface CreateInviteResponse {
  ok: boolean;
  inviteId: string;
  tokenPlaintext: string;
  code: string;
  codeHash: string;
  expiresAt: string | null;
  maxUses: number;
  note?: string;
  role: string;
  message: string;
}

interface CreateInviteRequest {
  expiresIn?: number;
  maxUses?: number;
  note?: string;
  role?: string;
}

export default function OwnerInvitesPage() {
  const [invites, setInvites] = useState<OwnerInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);

  // Form state
  const [maxUses, setMaxUses] = useState(1);
  const [expiresInDays, setExpiresInDays] = useState(7);
  const [note, setNote] = useState("");
  const [role, setRole] = useState("member");

  // Delete state
  const [deleting, setDeleting] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);

  // Show plaintext token once
  const [revealedToken, setRevealedToken] = useState<string | null>(null);
  const [revealedTokenId, setRevealedTokenId] = useState<string | null>(null);

  // View code state (press-to-reveal)
  const [viewingCode, setViewingCode] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load invites on mount
  useEffect(() => {
    loadInvites();
  }, []);

  async function loadInvites() {
    try {
      setLoading(true);
      const response = await fetch("/api/owner/invites", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 403) {
          window.location.href = "/owner/forbidden";
          return;
        }
        if (response.status === 401) {
          window.location.href = "/";
          return;
        }
        throw new Error(`Failed to load invites: ${response.status}`);
      }

      const data = await response.json();
      setInvites(data.invites || []);
      setLoading(false);
    } catch (err) {
      setError(String(err));
      setLoading(false);
    }
  }

  async function handleCreateInvite(e: React.FormEvent) {
    e.preventDefault();
    try {
      setCreating(true);
      setError(null);
      setSuccess(null);
      setRevealedToken(null);

      const payload: CreateInviteRequest = {
        maxUses: maxUses,
        note: note || undefined,
        role: role,
      };

      // Only send expiresIn if > 0 days
      if (expiresInDays > 0) {
        payload.expiresIn = expiresInDays * 24 * 60 * 60 * 1000; // Convert days to ms
      }

      const response = await fetch("/api/owner/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create invite");
      }

      const data = (await response.json()) as CreateInviteResponse;

      // Show the plaintext token
      setRevealedToken(data.tokenPlaintext);
      setRevealedTokenId(data.inviteId);

      // Reset form
      setNote("");
      setMaxUses(1);
      setExpiresInDays(7);
      setRole("member");

      setSuccess("Invite created successfully! Copy the token below - it will not be shown again.");

      // Reload invites list
      await loadInvites();

      // Auto-hide the token after 5 minutes (for safety)
      setTimeout(() => {
        setRevealedToken(null);
      }, 5 * 60 * 1000);

      setCreating(false);
    } catch (err) {
      setError(String(err));
      setCreating(false);
    }
  }

  async function handleRevokeInvite(inviteId: string) {
    const confirmed = window.confirm(
      "Are you sure you want to revoke this invite? It cannot be undone."
    );
    if (!confirmed) return;

    try {
      setRevoking(inviteId);
      const response = await fetch(`/api/owner/invites/${inviteId}/revoke`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to revoke invite");
      }

      setSuccess("Invite revoked successfully");
      await loadInvites();
      setRevoking(null);
    } catch (err) {
      setError(String(err));
      setRevoking(null);
    }
  }

  async function handleDeleteInvite(inviteId: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this invite? This cannot be undone."
    );
    if (!confirmed) return;

    try {
      setDeleting(inviteId);
      const response = await fetch(`/api/owner/invites/${inviteId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete invite");
      }

      setSuccess("Invite deleted successfully");
      await loadInvites();
      setDeleting(null);
    } catch (err) {
      setError(String(err));
      setDeleting(null);
    }
  }

  async function handleClearRevoked() {
    const confirmed = window.confirm(
      "Are you sure you want to delete all revoked invites? This cannot be undone."
    );
    if (!confirmed) return;

    try {
      setClearing(true);
      const response = await fetch("/api/owner/invites", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to clear revoked invites");
      }

      const data = await response.json();
      setSuccess(`Deleted ${data.deleted} revoked invite(s)`);
      await loadInvites();
      setClearing(false);
    } catch (err) {
      setError(String(err));
      setClearing(false);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setSuccess("Token copied to clipboard!");
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-['Press Start 2P'] text-green-400 mb-2">
          INVITE MANAGEMENT
        </h1>
        <p className="text-gray-400 font-mono text-sm">
          Create and manage owner invitations
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-500/30 bg-green-500/10">
          <AlertTitle className="text-green-400">Success</AlertTitle>
          <AlertDescription className="text-green-300">
            {success}
          </AlertDescription>
        </Alert>
      )}

      {/* Revealed Token Card */}
      {revealedToken && revealedTokenId && (
        <Card className="border-orange-500/50 bg-orange-500/5">
          <CardHeader>
            <CardTitle className="text-orange-400 text-lg">
              ⚠️ INVITE TOKEN - SAVE NOW
            </CardTitle>
            <CardDescription className="text-orange-300/80">
              This token will never be shown again. Copy it immediately.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-black/50 border border-orange-500/30 rounded p-4 font-mono text-sm break-all text-orange-400">
              {revealedToken}
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                onClick={() => copyToClipboard(revealedToken)}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                📋 Copy Token
              </Button>
              <Button
                onClick={() => {
                  const text = `Invite ID: ${revealedTokenId}\nToken: ${revealedToken}`;
                  copyToClipboard(text);
                }}
                variant="outline"
                className="border-orange-500/30 text-orange-300 hover:bg-orange-500/10"
              >
                Copy with ID
              </Button>
            </div>
            <div className="text-xs text-gray-500 border-t border-orange-500/20 pt-4">
              ⏱️ This token will auto-hide in 5 minutes for security.
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Invite Form */}
      <Card className="border-purple-500/30 bg-black/30">
        <CardHeader>
          <CardTitle className="text-purple-400 text-lg">
            Create New Invite
          </CardTitle>
          <CardDescription>
            Generate a new owner invitation token
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateInvite} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Max Uses */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-purple-300">
                  Max Uses (1-100)
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={maxUses}
                  onChange={(e) => setMaxUses(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 bg-black/50 border border-purple-500/30 rounded text-white font-mono text-sm focus:border-purple-400 focus:outline-none"
                  disabled={creating}
                />
              </div>

              {/* Expires In Days */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-purple-300">
                  Expires In (days, 0 = never)
                </label>
                <input
                  type="number"
                  min="0"
                  max="365"
                  value={expiresInDays}
                  onChange={(e) =>
                    setExpiresInDays(parseInt(e.target.value) || 0)
                  }
                  className="w-full px-3 py-2 bg-black/50 border border-purple-500/30 rounded text-white font-mono text-sm focus:border-purple-400 focus:outline-none"
                  disabled={creating}
                />
              </div>
            </div>

            {/* Note */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-purple-300">
                Note (optional, max 255 chars)
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) =>
                  setNote(e.target.value.substring(0, 255))
                }
                placeholder="e.g., 'Invite for team lead'"
                className="w-full px-3 py-2 bg-black/50 border border-purple-500/30 rounded text-white font-mono text-sm focus:border-purple-400 focus:outline-none placeholder-gray-600"
                disabled={creating}
              />
            </div>

            {/* Role */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-purple-300">
                Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                disabled={creating}
                className="w-full px-3 py-2 bg-black/50 border border-purple-500/30 rounded text-white font-mono text-sm focus:border-purple-400 focus:outline-none"
              >
                <option value="member">Member</option>
                <option value="leader">Leader</option>
                <option value="owner">Owner</option>
              </select>
              <div className="text-xs text-gray-500">
                Owner = full system access (use sparingly). Leader = elevated permissions. Member = standard access.
              </div>
            </div>

            <Button
              type="submit"
              disabled={creating}
              className="bg-purple-600 hover:bg-purple-700 text-white w-full"
            >
              {creating ? "Creating..." : "Create Invite"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Invites List */}
      <Card className="border-blue-500/30 bg-black/30">
        <CardHeader>
          <CardTitle className="text-blue-400 text-lg">
            Active Invites
          </CardTitle>
          <CardDescription>
            {loading ? "Loading..." : `${invites.length} invite${invites.length !== 1 ? "s" : ""}`}
          </CardDescription>
        </CardHeader>
        {(() => {
          const revokedCount = invites.filter(i => i.revokedAt).length;
          return revokedCount > 0 ? (
            <div className="px-6 pt-0 pb-2">
              <Button
                onClick={handleClearRevoked}
                disabled={clearing}
                variant="outline"
                size="sm"
                className="border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs"
              >
                {clearing ? "Clearing..." : `Clear All Revoked (${revokedCount})`}
              </Button>
            </div>
          ) : null;
        })()}
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">
              Loading invites...
            </div>
          ) : invites.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No invites yet. Create one above.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm font-mono">
                <thead className="border-b border-blue-500/20">
                  <tr>
                    <th className="text-left py-2 px-2 text-blue-300">
                      Created
                    </th>
                    <th className="text-left py-2 px-2 text-blue-300">
                      Role
                    </th>
                    <th className="text-left py-2 px-2 text-blue-300">
                      Expires
                    </th>
                    <th className="text-left py-2 px-2 text-blue-300">
                      Uses
                    </th>
                    <th className="text-left py-2 px-2 text-blue-300">
                      Status
                    </th>
                    <th className="text-left py-2 px-2 text-blue-300">
                      Note
                    </th>
                    <th className="text-right py-2 px-2 text-blue-300">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="space-y-1">
                  {invites.map((invite) => {
                    const isRevoked = !!invite.revokedAt;
                    const isExpired = invite.expiresAt
                      ? new Date(invite.expiresAt) < new Date()
                      : false;
                    const isMaxedOut = invite.useCount >= invite.maxUses;

                    return (
                      <tr
                        key={invite.id}
                        className="border-b border-blue-500/10 hover:bg-blue-500/5"
                      >
                        <td className="py-2 px-2 text-blue-200">
                          {new Date(invite.createdAt).toLocaleDateString(
                            undefined,
                            {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </td>
                        <td className="py-2 px-2">
                          {invite.role === "owner" ? (
                            <span className="text-red-400 font-bold">OWNER</span>
                          ) : invite.role === "leader" ? (
                            <span className="text-yellow-400 font-bold">LEADER</span>
                          ) : (
                            <span className="text-green-400">MEMBER</span>
                          )}
                        </td>
                        <td className="py-2 px-2 text-blue-200">
                          {invite.expiresAt
                            ? new Date(invite.expiresAt).toLocaleDateString(
                              undefined,
                              {
                                month: "short",
                                day: "numeric",
                              }
                            )
                            : "Never"}
                        </td>
                        <td className="py-2 px-2 text-blue-200">
                          {invite.useCount}/{invite.maxUses}
                        </td>
                        <td className="py-2 px-2">
                          {isRevoked ? (
                            <span className="text-red-400">REVOKED</span>
                          ) : isExpired ? (
                            <span className="text-red-400">EXPIRED</span>
                          ) : isMaxedOut ? (
                            <span className="text-yellow-400">USED</span>
                          ) : (
                            <span className="text-green-400">ACTIVE</span>
                          )}
                        </td>
                        <td className="py-2 px-2 text-gray-400 max-w-xs truncate">
                          {invite.note || "-"}
                        </td>
                        <td className="py-2 px-2 text-right space-x-2">
                          {/* View button - press-to-reveal */}
                          {invite.code && (
                            viewingCode === invite.id ? (
                              <span
                                className="inline-flex items-center gap-1 text-green-400 font-mono text-xs cursor-pointer"
                                onMouseUp={() => setViewingCode(null)}
                                onMouseLeave={() => setViewingCode(null)}
                                onTouchEnd={() => setViewingCode(null)}
                                onClick={async () => {
                                  await navigator.clipboard.writeText(invite.code!);
                                  setCopiedId(invite.id);
                                  setTimeout(() => setCopiedId(null), 1500);
                                }}
                                title="Click to copy"
                              >
                                {copiedId === invite.id ? (
                                  <span className="text-green-300">Copied!</span>
                                ) : (
                                  <span className="select-all">{invite.code}</span>
                                )}
                              </span>
                            ) : (
                              <Button
                                onMouseDown={() => setViewingCode(invite.id)}
                                onTouchStart={() => setViewingCode(invite.id)}
                                size="sm"
                                className="bg-purple-700 hover:bg-purple-600 text-white text-xs"
                              >
                                View
                              </Button>
                            )
                          )}
                          {!isRevoked && (
                            <Button
                              onClick={() => handleRevokeInvite(invite.id)}
                              disabled={revoking === invite.id}
                              size="sm"
                              className="bg-red-600 hover:bg-red-700 text-white text-xs"
                            >
                              {revoking === invite.id ? "..." : "Revoke"}
                            </Button>
                          )}
                          {isRevoked && (
                            <Button
                              onClick={() => handleDeleteInvite(invite.id)}
                              disabled={deleting === invite.id}
                              size="sm"
                              variant="outline"
                              className="border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs"
                            >
                              {deleting === invite.id ? "..." : "Delete"}
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
