"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Shield, ArrowLeft, Save } from "lucide-react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import Link from "next/link";

interface Guild {
  id: string;
  discordId: string;
  name: string;
  iconUrl?: string | null;
  ownerId?: string | null;
  settings?: Record<string, any>;
  memberCount?: number;
  messageCount?: number;
  createdAt: string;
  updatedAt: string;
}

export default function GuildDetailPage() {
  const params = useParams();
  const router = useRouter();
  const guildId = params.id as string;

  const [guild, setGuild] = useState<Guild | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [settingsJson, setSettingsJson] = useState("");

  const fetchGuild = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/guilds/${guildId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch guild");
      }

      const data = await response.json();
      setGuild(data);
      setSettingsJson(JSON.stringify(data.settings || {}, null, 2));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load guild");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      // Parse and validate JSON
      let settings;
      try {
        settings = JSON.parse(settingsJson);
      } catch (err) {
        throw new Error("Invalid JSON format");
      }

      const response = await fetch(`/api/guilds/${guildId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update guild");
      }

      const updatedGuild = await response.json();
      setGuild(updatedGuild);
      setSuccess(true);

      // Auto-hide success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchGuild();
  }, [guildId]);

  if (loading) {
    return (
      <ProtectedRoute requiredRole="admin">
        <div className="container px-4 py-8">
          <div className="mx-auto max-w-4xl">
            <p className="text-muted-foreground">Loading guild...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!guild) {
    return (
      <ProtectedRoute requiredRole="admin">
        <div className="container px-4 py-8">
          <div className="mx-auto max-w-4xl">
            <Callout variant="error">Guild not found</Callout>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="container px-4 py-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8">
            <Link href="/guilds">
              <Button variant="ghost" size="sm" className="gap-2 mb-4">
                <ArrowLeft className="h-4 w-4" />
                Back to Guilds
              </Button>
            </Link>

            <div className="flex items-center gap-4">
              {guild.iconUrl ? (
                <img
                  src={guild.iconUrl}
                  alt={guild.name}
                  className="w-16 h-16 rounded-full"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                  <Shield className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              <div>
                <h1 className="text-4xl font-bold">{guild.name}</h1>
                <p className="text-muted-foreground">
                  Discord ID: {guild.discordId}
                </p>
              </div>
            </div>
          </div>

          {error && (
            <Callout variant="error" className="mb-8">
              {error}
            </Callout>
          )}

          {success && (
            <Callout variant="success" className="mb-8">
              Settings saved successfully!
            </Callout>
          )}

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Guild Information</CardTitle>
                <CardDescription>
                  Basic information about this Discord guild
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Guild Name
                    </label>
                    <p className="text-lg">{guild.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Discord ID
                    </label>
                    <p className="text-lg font-mono">{guild.discordId}</p>
                  </div>
                  {guild.ownerId && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Owner ID
                      </label>
                      <p className="text-lg font-mono">{guild.ownerId}</p>
                    </div>
                  )}
                  {guild.memberCount !== undefined && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Member Count
                      </label>
                      <p className="text-lg">{guild.memberCount}</p>
                    </div>
                  )}
                  {guild.messageCount !== undefined && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Message Count
                      </label>
                      <p className="text-lg">{guild.messageCount}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Created At
                    </label>
                    <p className="text-lg">
                      {new Date(guild.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Guild Settings</CardTitle>
                <CardDescription>
                  Configure guild-specific settings (JSON format)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <textarea
                    value={settingsJson}
                    onChange={(e) => setSettingsJson(e.target.value)}
                    className="w-full h-64 p-4 font-mono text-sm border rounded-lg bg-muted/50"
                    placeholder='{"key": "value"}'
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Edit the JSON settings above. Use valid JSON format.
                  </p>
                </div>
                <div className="flex justify-end">
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {saving ? "Saving..." : "Save Settings"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
