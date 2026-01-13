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

interface AppSettings {
  id: string;
  refreshRateCapMs: number;
  debugDockEnabled: boolean;
  artifactSourceDisplay: "icon" | "text" | "both";
  updatedAt: string;
  updatedById?: string;
}

interface SettingsResponse {
  ok: boolean;
  settings: AppSettings;
}

const REFRESH_RATE_MIN = 100;
const REFRESH_RATE_MAX = 3600000;

export default function OwnerSettingsPage() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [refreshRateCapMs, setRefreshRateCapMs] = useState(5000);
  const [debugDockEnabled, setDebugDockEnabled] = useState(false);
  const [artifactSourceDisplay, setArtifactSourceDisplay] = useState<
    "icon" | "text" | "both"
  >("icon");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  // Check if form has changes
  useEffect(() => {
    if (!settings) return;

    const changed =
      refreshRateCapMs !== settings.refreshRateCapMs ||
      debugDockEnabled !== settings.debugDockEnabled ||
      artifactSourceDisplay !== settings.artifactSourceDisplay;

    setHasChanges(changed);
  }, [refreshRateCapMs, debugDockEnabled, artifactSourceDisplay, settings]);

  async function loadSettings() {
    try {
      setLoading(true);
      const response = await fetch("/api/owner/settings", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
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
        throw new Error(`Failed to load settings: ${response.status}`);
      }

      const data = (await response.json()) as SettingsResponse;
      setSettings(data.settings);
      setRefreshRateCapMs(data.settings.refreshRateCapMs);
      setDebugDockEnabled(data.settings.debugDockEnabled);
      setArtifactSourceDisplay(data.settings.artifactSourceDisplay);
      setLoading(false);
    } catch (err) {
      setError(String(err));
      setLoading(false);
    }
  }

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    if (!settings) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const payload = {
        refreshRateCapMs,
        debugDockEnabled,
        artifactSourceDisplay,
      };

      const response = await fetch("/api/owner/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save settings");
      }

      const data = (await response.json()) as SettingsResponse;
      setSettings(data.settings);
      setSuccess("Settings saved successfully!");
      setSaving(false);
      setHasChanges(false);

      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      setError(String(err));
      setSaving(false);
    }
  }

  function handleReset() {
    if (!settings) return;
    setRefreshRateCapMs(settings.refreshRateCapMs);
    setDebugDockEnabled(settings.debugDockEnabled);
    setArtifactSourceDisplay(settings.artifactSourceDisplay);
    setHasChanges(false);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-['Press Start 2P'] text-green-400 mb-2">
          SYSTEM SETTINGS
        </h1>
        <p className="text-gray-400 font-mono text-sm">
          Configure application behavior and features
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

      {loading ? (
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center space-y-4">
            <div className="text-6xl animate-pulse">⚙️</div>
            <p className="text-gray-400 font-mono">Loading settings...</p>
          </div>
        </div>
      ) : settings ? (
        <Card className="border-blue-500/30 bg-black/30">
          <CardHeader>
            <CardTitle className="text-blue-400 text-lg">
              Application Settings
            </CardTitle>
            <CardDescription>
              Last updated:{" "}
              {new Date(settings.updatedAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveSettings} className="space-y-6">
              {/* Refresh Rate Cap */}
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-blue-300 mb-2">
                    Refresh Rate Cap (milliseconds)
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="number"
                      min={REFRESH_RATE_MIN}
                      max={REFRESH_RATE_MAX}
                      value={refreshRateCapMs}
                      onChange={(e) =>
                        setRefreshRateCapMs(parseInt(e.target.value) || REFRESH_RATE_MIN)
                      }
                      className="flex-1 px-3 py-2 bg-black/50 border border-blue-500/30 rounded text-white font-mono text-sm focus:border-blue-400 focus:outline-none"
                      disabled={saving}
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    Minimum: {REFRESH_RATE_MIN}ms | Maximum: {REFRESH_RATE_MAX.toLocaleString()}ms
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    Controls the minimum time between API requests for data refresh operations.
                  </div>
                </div>
              </div>

              {/* Debug Dock Toggle */}
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-black/50 border border-blue-500/30 rounded">
                  <div>
                    <label className="block text-sm font-medium text-blue-300">
                      Enable Debug Dock on Pages
                    </label>
                    <p className="text-xs text-gray-600 mt-1">
                      Shows debug information panel on all owner pages
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDebugDockEnabled(!debugDockEnabled)}
                    disabled={saving}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      debugDockEnabled
                        ? "bg-green-600"
                        : "bg-gray-600"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white transition-transform transform ${
                        debugDockEnabled ? "translate-x-6" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Artifact Source Display */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-blue-300 mb-2">
                  Artifact Source Display
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {(["icon", "text", "both"] as const).map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setArtifactSourceDisplay(option)}
                      disabled={saving}
                      className={`p-4 rounded border-2 transition-all text-sm font-medium capitalize ${
                        artifactSourceDisplay === option
                          ? "border-blue-400 bg-blue-500/20 text-blue-300"
                          : "border-blue-500/30 bg-black/50 text-blue-200 hover:border-blue-400"
                      }`}
                    >
                      {option === "icon" && "🎨 Icon Only"}
                      {option === "text" && "📝 Text Only"}
                      {option === "both" && "📊 Both"}
                    </button>
                  ))}
                </div>
                <div className="text-xs text-gray-600 mt-2">
                  Controls how artifact sources are displayed in the application.
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex gap-3 pt-6 border-t border-blue-500/20">
                <Button
                  type="submit"
                  disabled={!hasChanges || saving}
                  className="bg-blue-600 hover:bg-blue-700 text-white flex-1"
                >
                  {saving ? "Saving..." : "Save Settings"}
                </Button>
                <Button
                  type="button"
                  onClick={handleReset}
                  disabled={!hasChanges || saving}
                  variant="outline"
                  className="border-blue-500/30 text-blue-300 hover:bg-blue-500/10 flex-1"
                >
                  Reset
                </Button>
              </div>

              {!hasChanges && (
                <div className="text-xs text-gray-600 text-center">
                  No changes made
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      ) : (
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center space-y-4">
            <div className="text-6xl text-red-500">⚠</div>
            <p className="text-gray-400 font-mono">
              Failed to load settings. Please refresh.
            </p>
          </div>
        </div>
      )}

      {/* Debug Dock */}
      <DebugDock
        additionalInfo={{
          route: "/owner/settings",
          debugDockEnabled,
          refreshRateCapMs,
        }}
      />
    </div>
  );
}
