"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Callout } from "@/components/ui/callout";

interface GuildFlags {
  guildId: string;
  theme: {
    colorPrimary?: string;
    badgeStyle?: "rounded" | "square" | "pill";
  };
  experiments: {
    ensembleOCR?: boolean;
    secondApprover?: boolean;
    askManus?: boolean;
    publicStats?: boolean;
  };
  updatedAt: string;
}

export default function FlagsAdminPage() {
  const [guildId, setGuildId] = useState("demo");
  const [flags, setFlags] = useState<GuildFlags | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchFlags = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/guilds/${guildId}/flags`);
      if (response.ok) {
        const data = await response.json();
        setFlags(data);
      }
    } catch (error) {
      console.error("Failed to fetch flags:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (guildId) {
      fetchFlags();
    }
  }, [guildId]);

  const updateFlag = async (path: string, value: any) => {
    setSaving(true);
    setMessage(null);

    try {
      const updates: any = {};
      const [section, key] = path.split(".");

      if (section === "theme") {
        updates.theme = { [key]: value };
      } else if (section === "experiments") {
        updates.experiments = { [key]: value };
      }

      const response = await fetch(`/api/guilds/${guildId}/flags`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        const data = await response.json();
        setFlags(data.flags);
        setMessage({ type: "success", text: "Flags updated successfully" });
        setTimeout(() => setMessage(null), 3000);
      } else {
        const error = await response.json();
        setMessage({ type: "error", text: error.message || "Failed to update flags" });
      }
    } catch (error) {
      console.error("Failed to update flags:", error);
      setMessage({ type: "error", text: "Failed to update flags" });
    } finally {
      setSaving(false);
    }
  };

  const toggleExperiment = (key: keyof GuildFlags["experiments"]) => {
    if (!flags) return;
    const newValue = !flags.experiments[key];
    updateFlag(`experiments.${key}`, newValue);
  };

  return (
    <div className="container px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="mb-2 text-4xl font-bold">Feature Flags</h1>
          <p className="text-muted-foreground">
            Manage guild-scoped themes and experiments
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Guild Selection</CardTitle>
            <CardDescription>Select a guild to manage flags</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <input
                type="text"
                value={guildId}
                onChange={(e) => setGuildId(e.target.value)}
                placeholder="Enter guild ID"
                className="flex-1 rounded-md border bg-background px-3 py-2 text-sm"
              />
              <Button onClick={fetchFlags} disabled={loading}>
                {loading ? "Loading..." : "Load Flags"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {message && (
          <Callout variant={message.type === "success" ? "success" : "error"} className="mb-6">
            {message.text}
          </Callout>
        )}

        {flags && (
          <>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Theme Settings</CardTitle>
                <CardDescription>Customize guild theme</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Primary Color
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={flags.theme.colorPrimary || "#39FF14"}
                      onChange={(e) => updateFlag("theme.colorPrimary", e.target.value)}
                      className="h-10 w-20 cursor-pointer rounded border"
                      disabled={saving}
                    />
                    <input
                      type="text"
                      value={flags.theme.colorPrimary || "#39FF14"}
                      onChange={(e) => updateFlag("theme.colorPrimary", e.target.value)}
                      className="flex-1 rounded-md border bg-background px-3 py-2 text-sm font-mono"
                      disabled={saving}
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Badge Style
                  </label>
                  <div className="flex gap-2">
                    {(["rounded", "square", "pill"] as const).map((style) => (
                      <Button
                        key={style}
                        variant={flags.theme.badgeStyle === style ? "neon" : "outline"}
                        size="sm"
                        onClick={() => updateFlag("theme.badgeStyle", style)}
                        disabled={saving}
                      >
                        {style}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Experiments</CardTitle>
                <CardDescription>
                  Toggle experimental features (zero-downtime)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(flags.experiments).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">
                        {key.replace(/([A-Z])/g, " $1").trim()}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {getExperimentDescription(key)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={value ? "default" : "outline"}>
                        {value ? "Enabled" : "Disabled"}
                      </Badge>
                      <Button
                        variant={value ? "destructive" : "neon"}
                        size="sm"
                        onClick={() => toggleExperiment(key as keyof GuildFlags["experiments"])}
                        disabled={saving}
                      >
                        {value ? "Disable" : "Enable"}
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="mt-6 text-xs text-muted-foreground">
              Last updated: {new Date(flags.updatedAt).toLocaleString()}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function getExperimentDescription(key: string): string {
  const descriptions: Record<string, string> = {
    ensembleOCR: "Use multiple OCR engines for better accuracy",
    secondApprover: "Require second approval for critical actions",
    askManus: "Enable Ask Manus runtime assistance bar",
    publicStats: "Allow public access to guild stats",
  };

  return descriptions[key] || "Experimental feature";
}
