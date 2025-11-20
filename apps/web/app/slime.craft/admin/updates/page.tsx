"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Callout } from "@/components/ui/callout";
import { Trash2, Pin, PinOff, RefreshCw } from "lucide-react";

interface SlimecraftUpdate {
  id: number;
  type: string;
  title: string | null;
  body: string;
  pinned: boolean;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function SlimecraftUpdatesAdminPage() {
  const [updates, setUpdates] = useState<SlimecraftUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // New update form state
  const [newUpdate, setNewUpdate] = useState({
    type: "info",
    title: "",
    body: "",
    pinned: false,
  });

  const fetchUpdates = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/slimecraft/updates/latest?limit=50");
      if (res.ok) {
        const data = await res.json();
        setUpdates(data.updates || []);
      } else {
        setMessage({ type: "error", text: "Failed to load updates" });
      }
    } catch (error) {
      console.error("[Admin Updates] Fetch error:", error);
      setMessage({ type: "error", text: "Failed to load updates" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUpdates();
  }, []);

  const createUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newUpdate.body.trim()) {
      setMessage({ type: "error", text: "Update body is required" });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/slimecraft/updates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: newUpdate.type,
          title: newUpdate.title.trim() || null,
          body: newUpdate.body.trim(),
          pinned: newUpdate.pinned,
        }),
      });

      if (res.ok) {
        setMessage({ type: "success", text: "Update created successfully" });
        setNewUpdate({ type: "info", title: "", body: "", pinned: false });
        fetchUpdates();
        setTimeout(() => setMessage(null), 3000);
      } else {
        const error = await res.json();
        setMessage({ type: "error", text: error.message || "Failed to create update" });
      }
    } catch (error) {
      console.error("[Admin Updates] Create error:", error);
      setMessage({ type: "error", text: "Failed to create update" });
    } finally {
      setSaving(false);
    }
  };

  const togglePinned = async (id: number, currentPinned: boolean) => {
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/slimecraft/updates/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pinned: !currentPinned }),
      });

      if (res.ok) {
        setMessage({
          type: "success",
          text: `Update ${!currentPinned ? "pinned" : "unpinned"} successfully`,
        });
        fetchUpdates();
        setTimeout(() => setMessage(null), 2000);
      } else {
        const error = await res.json();
        setMessage({ type: "error", text: error.message || "Failed to toggle pinned" });
      }
    } catch (error) {
      console.error("[Admin Updates] Toggle pinned error:", error);
      setMessage({ type: "error", text: "Failed to toggle pinned" });
    } finally {
      setSaving(false);
    }
  };

  const deleteUpdate = async (id: number) => {
    if (!confirm("Are you sure you want to delete this update? This action cannot be undone.")) {
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/slimecraft/updates/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setMessage({ type: "success", text: "Update deleted successfully" });
        fetchUpdates();
        setTimeout(() => setMessage(null), 2000);
      } else {
        const error = await res.json();
        setMessage({ type: "error", text: error.message || "Failed to delete update" });
      }
    } catch (error) {
      console.error("[Admin Updates] Delete error:", error);
      setMessage({ type: "error", text: "Failed to delete update" });
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);
    } catch {
      return dateString;
    }
  };

  return (
    <div className="container px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="mb-2 text-4xl font-bold">Manage Slime.craft Updates</h1>
            <p className="text-muted-foreground">
              Post and manage server updates and notices
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchUpdates}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {message && (
          <Callout variant={message.type === "success" ? "success" : "error"} className="mb-6">
            {message.text}
          </Callout>
        )}

        {/* New Update Form */}
        <Card className="mb-8 rounded-2xl border border-emerald-500/30 bg-zinc-900/40">
          <CardHeader>
            <CardTitle>New Update</CardTitle>
            <CardDescription>Post a new update to the Slime.craft server</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={createUpdate} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium">Type</label>
                <div className="flex gap-2">
                  {["info", "warning", "outage"].map((type) => (
                    <Button
                      key={type}
                      type="button"
                      variant={newUpdate.type === type ? "neon" : "outline"}
                      size="sm"
                      onClick={() => setNewUpdate({ ...newUpdate, type })}
                      disabled={saving}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Title (optional)
                </label>
                <input
                  type="text"
                  value={newUpdate.title}
                  onChange={(e) => setNewUpdate({ ...newUpdate, title: e.target.value })}
                  placeholder="e.g., Server Maintenance, New Area Opened"
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  disabled={saving}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Body <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={newUpdate.body}
                  onChange={(e) => setNewUpdate({ ...newUpdate, body: e.target.value })}
                  placeholder="Enter the update content..."
                  rows={4}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-y"
                  required
                  disabled={saving}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="pinned"
                  checked={newUpdate.pinned}
                  onChange={(e) => setNewUpdate({ ...newUpdate, pinned: e.target.checked })}
                  className="h-4 w-4 rounded"
                  disabled={saving}
                />
                <label htmlFor="pinned" className="text-sm font-medium cursor-pointer">
                  Pin this update to the top
                </label>
              </div>

              <Button type="submit" disabled={saving || !newUpdate.body.trim()}>
                {saving ? "Publishing..." : "Publish Update"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Updates List */}
        <div className="mb-4">
          <h2 className="text-2xl font-bold">Recent Updates</h2>
          <p className="text-sm text-muted-foreground">
            {updates.length} update{updates.length !== 1 ? "s" : ""} total
          </p>
        </div>

        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="rounded-2xl border border-emerald-500/30 bg-zinc-900/40">
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
              </Card>
            ))}
          </div>
        )}

        {!loading && updates.length === 0 && (
          <Card className="rounded-2xl border border-emerald-500/30 bg-zinc-900/40">
            <CardHeader>
              <CardTitle>No updates yet</CardTitle>
              <CardDescription>
                Create your first update using the form above.
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {!loading && updates.length > 0 && (
          <div className="space-y-3">
            {updates.map((update) => (
              <Card
                key={update.id}
                className="rounded-2xl border border-emerald-500/30 bg-zinc-900/40"
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {update.pinned && (
                          <Pin className="h-4 w-4 text-emerald-500" />
                        )}
                        <CardTitle className="text-base">
                          {update.title || "Server Update"}
                        </CardTitle>
                        <Badge
                          variant={
                            update.type === "outage"
                              ? "destructive"
                              : update.type === "warning"
                              ? "default"
                              : "secondary"
                          }
                          className={
                            update.type === "warning" ? "bg-yellow-600" : ""
                          }
                        >
                          {update.type}
                        </Badge>
                      </div>
                      <CardDescription className="text-xs">
                        {formatDate(update.createdAt)} • ID: {update.id}
                      </CardDescription>
                      <p className="mt-2 text-sm whitespace-pre-wrap">
                        {update.body.length > 150
                          ? `${update.body.substring(0, 150)}...`
                          : update.body}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => togglePinned(update.id, update.pinned)}
                        disabled={saving}
                        title={update.pinned ? "Unpin" : "Pin"}
                      >
                        {update.pinned ? (
                          <PinOff className="h-4 w-4" />
                        ) : (
                          <Pin className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteUpdate(update.id)}
                        disabled={saving}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
