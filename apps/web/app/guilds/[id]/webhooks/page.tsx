"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";

/**
 * Webhook Management Page
 * Allows guild administrators to configure webhooks for outbound events
 */

interface Webhook {
  id: number;
  guildId: string;
  name: string;
  targetUrl: string;
  enabled: boolean;
  eventTypes: string;
  createdAt: string;
  updatedAt: string;
  deliveryCount: number;
  hasSecret: boolean;
}

interface WebhookFormData {
  name: string;
  targetUrl: string;
  eventTypes: string;
  enabled: boolean;
  secret: string;
}

const AVAILABLE_EVENT_TYPES = [
  "CLUB_SNAPSHOT_CREATED",
  "CLUB_SNAPSHOT_UPDATED",
  "CLUB_ANALYSIS_COMPLETED",
  "SEASON_CREATED",
  "SEASON_UPDATED",
  "SEASON_CLOSED",
  "CODES_UPDATED",
  "CODES_REFRESH_STARTED",
  "CODES_REFRESH_COMPLETED",
  "GUILD_SETTINGS_UPDATED",
  "SCREENSHOT_ANALYZED",
  "SCREENSHOT_COMPARISON_CREATED",
  "CHAT_MESSAGE_CREATED",
  "STATS_GENERATED",
];

export default function WebhooksPage() {
  const params = useParams();
  const guildId = params.id as string;

  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [formData, setFormData] = useState<WebhookFormData>({
    name: "",
    targetUrl: "",
    eventTypes: "",
    enabled: true,
    secret: "",
  });

  // Load webhooks
  useEffect(() => {
    loadWebhooks();
  }, [guildId]);

  const loadWebhooks = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/guilds/${guildId}/webhooks`);
      if (!response.ok) {
        throw new Error("Failed to fetch webhooks");
      }
      const data = await response.json();
      setWebhooks(data.webhooks || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load webhooks");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const payload = {
        guildId,
        name: formData.name,
        targetUrl: formData.targetUrl,
        eventTypes: formData.eventTypes,
        enabled: formData.enabled,
        secret: formData.secret || undefined,
      };

      if (editingId) {
        // Update existing webhook
        const response = await fetch(`/api/webhooks/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to update webhook");
        }
      } else {
        // Create new webhook
        const response = await fetch(`/api/guilds/${guildId}/webhooks`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to create webhook");
        }
      }

      // Reset form and reload
      setFormData({
        name: "",
        targetUrl: "",
        eventTypes: "",
        enabled: true,
        secret: "",
      });
      setShowForm(false);
      setEditingId(null);
      await loadWebhooks();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const handleEdit = (webhook: Webhook) => {
    setFormData({
      name: webhook.name,
      targetUrl: webhook.targetUrl,
      eventTypes: webhook.eventTypes,
      enabled: webhook.enabled,
      secret: "", // Don't pre-fill secret for security
    });
    setEditingId(webhook.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this webhook?")) {
      return;
    }

    try {
      setError(null);
      const response = await fetch(`/api/webhooks/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete webhook");
      }

      await loadWebhooks();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete webhook");
    }
  };

  const toggleEnabled = async (webhook: Webhook) => {
    try {
      setError(null);
      const response = await fetch(`/api/webhooks/${webhook.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !webhook.enabled }),
      });

      if (!response.ok) {
        throw new Error("Failed to update webhook");
      }

      await loadWebhooks();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update webhook");
    }
  };

  const handleEventTypeToggle = (eventType: string) => {
    const currentTypes = formData.eventTypes
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const index = currentTypes.indexOf(eventType);

    if (index > -1) {
      currentTypes.splice(index, 1);
    } else {
      currentTypes.push(eventType);
    }

    setFormData({ ...formData, eventTypes: currentTypes.join(",") });
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Webhooks</h1>
          <p>Loading webhooks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Webhooks & Integrations</h1>
          <button
            onClick={() => {
              setShowForm(!showForm);
              setEditingId(null);
              setFormData({
                name: "",
                targetUrl: "",
                eventTypes: "",
                enabled: true,
                secret: "",
              });
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            {showForm ? "Cancel" : "New Webhook"}
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {showForm && (
          <div className="mb-8 p-6 bg-gray-50 border border-gray-200 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">
              {editingId ? "Edit Webhook" : "Create New Webhook"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="My Webhook"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Target URL
                </label>
                <input
                  type="url"
                  value={formData.targetUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, targetUrl: e.target.value })
                  }
                  placeholder="https://example.com/webhook"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Event Types
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-64 overflow-y-auto p-4 bg-white border border-gray-300 rounded">
                  {AVAILABLE_EVENT_TYPES.map((eventType) => (
                    <label
                      key={eventType}
                      className="flex items-center space-x-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.eventTypes
                          .split(",")
                          .map((t) => t.trim())
                          .includes(eventType)}
                        onChange={() => handleEventTypeToggle(eventType)}
                        className="rounded"
                      />
                      <span className="text-sm">{eventType}</span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Selected: {formData.eventTypes || "None"}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Secret (Optional)
                </label>
                <input
                  type="password"
                  value={formData.secret}
                  onChange={(e) =>
                    setFormData({ ...formData, secret: e.target.value })
                  }
                  placeholder="For HMAC signature verification"
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Used for webhook signature verification (HMAC). Leave empty to
                  not use signing.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="enabled"
                  checked={formData.enabled}
                  onChange={(e) =>
                    setFormData({ ...formData, enabled: e.target.checked })
                  }
                  className="rounded"
                />
                <label htmlFor="enabled" className="text-sm font-medium">
                  Enabled
                </label>
              </div>

              <div className="flex space-x-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  {editingId ? "Update" : "Create"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="space-y-4">
          {webhooks.length === 0 ? (
            <div className="p-8 text-center bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-gray-600">
                No webhooks configured. Click "New Webhook" to create one.
              </p>
            </div>
          ) : (
            webhooks.map((webhook) => (
              <div
                key={webhook.id}
                className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-xl font-semibold">{webhook.name}</h3>
                      <span
                        className={`px-2 py-1 text-xs rounded ${
                          webhook.enabled
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {webhook.enabled ? "Enabled" : "Disabled"}
                      </span>
                      {webhook.hasSecret && (
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                          Signed
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      <strong>URL:</strong> {webhook.targetUrl}
                    </p>
                    <p className="text-sm text-gray-600 mb-2">
                      <strong>Events:</strong> {webhook.eventTypes}
                    </p>
                    <p className="text-xs text-gray-500">
                      Deliveries: {webhook.deliveryCount} | Created:{" "}
                      {new Date(webhook.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => toggleEnabled(webhook)}
                      className={`px-3 py-1 text-sm rounded ${
                        webhook.enabled
                          ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                          : "bg-green-100 text-green-800 hover:bg-green-200"
                      }`}
                    >
                      {webhook.enabled ? "Disable" : "Enable"}
                    </button>
                    <button
                      onClick={() => handleEdit(webhook)}
                      className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(webhook.id)}
                      className="px-3 py-1 text-sm bg-red-100 text-red-800 rounded hover:bg-red-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
