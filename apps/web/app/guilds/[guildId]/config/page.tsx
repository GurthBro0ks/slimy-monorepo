"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type GuildFeatures = {
  clubAnalytics?: boolean;
  seasons?: boolean;
  codesV2?: boolean;
  notifications?: boolean;
};

type GuildConfig = {
  features: GuildFeatures;
};

export default function GuildConfigPage() {
  const params = useParams();
  const guildId = params.guildId as string;

  const [config, setConfig] = useState<GuildConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await fetch(`/api/guild-config/${guildId}`);
        if (!res.ok) throw new Error("Failed to load config");
        const data = await res.json();
        setConfig(data.config);
      } catch (err: any) {
        setError(err.message || "Error loading config");
      } finally {
        setLoading(false);
      }
    }
    loadConfig();
  }, [guildId]);

  async function toggleFeature(key: keyof GuildFeatures) {
    if (!config) return;
    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const nextFeatures = {
        ...config.features,
        [key]: !config.features?.[key],
      };

      const res = await fetch(`/api/guild-config/${guildId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ features: nextFeatures }),
      });

      if (!res.ok) throw new Error("Failed to update config");

      const data = await res.json();
      setConfig(data.config);
      setSuccessMessage("Configuration updated successfully");

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.message || "Error updating config");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <p className="text-gray-600 dark:text-gray-400">Loading guild configuration...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !config) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-red-800 dark:text-red-400 mb-2">Error</h2>
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <p className="text-gray-600 dark:text-gray-400">No configuration found.</p>
          </div>
        </div>
      </div>
    );
  }

  const features = config.features || {};

  const rows: Array<{
    key: keyof GuildFeatures;
    label: string;
    description: string;
  }> = [
    {
      key: "clubAnalytics",
      label: "Club Analytics",
      description: "Enable advanced club stats, weekly deltas, and detailed performance tracking.",
    },
    {
      key: "seasons",
      label: "Seasons",
      description: "Enable season-based tracking and season summaries for competitive play.",
    },
    {
      key: "codesV2",
      label: "Codes v2",
      description: "Use the new multi-source Snail Codes aggregator with enhanced features.",
    },
    {
      key: "notifications",
      label: "Notifications",
      description: "Allow in-app and DM notifications for this guild.",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Guild Configuration
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Guild ID: {guildId}</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
              <p className="text-sm text-green-600 dark:text-green-400">{successMessage}</p>
            </div>
          )}

          {saving && (
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
              <p className="text-sm text-blue-600 dark:text-blue-400">Saving changes...</p>
            </div>
          )}

          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Feature Flags
            </h2>

            {rows.map((row) => (
              <div
                key={row.key}
                className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex-1 mr-4">
                  <div className="font-medium text-gray-900 dark:text-white mb-1">
                    {row.label}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {row.description}
                  </div>
                </div>

                <label className="inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={!!features[row.key]}
                    onChange={() => toggleFeature(row.key)}
                    disabled={saving}
                  />
                  <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              About Feature Flags
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Feature flags allow you to enable or disable specific features for your guild.
              Changes take effect immediately and apply to all members of the guild.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
