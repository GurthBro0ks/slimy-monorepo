"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Callout } from "@/components/ui/callout";
import { User, Settings } from "lucide-react";
import { ProtectedRoute } from "@/components/auth/protected-route";

interface UserProfile {
  id: string;
  discordId: string;
  username: string | null;
  globalName: string | null;
  avatar: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  timezone: string | null;
  preferences: any;
  createdAt: string;
  updatedAt: string;
}

const TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Australia/Sydney",
];

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form fields
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [timezone, setTimezone] = useState("UTC");
  const [theme, setTheme] = useState("auto");
  const [defaultModel, setDefaultModel] = useState("");

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/profile/me");

      if (response.status === 401) {
        setError("Please log in to view your profile");
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to fetch profile");
      }

      const data = await response.json();
      setProfile(data);

      // Populate form fields
      setDisplayName(data.displayName || "");
      setAvatarUrl(data.avatarUrl || "");
      setTimezone(data.timezone || "UTC");

      if (data.preferences) {
        setTheme(data.preferences.theme || "auto");
        setDefaultModel(data.preferences.defaultModel || "");
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
      setError("Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      const preferences = {
        theme,
        defaultModel,
      };

      const response = await fetch("/api/profile/me", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          displayName: displayName || null,
          avatarUrl: avatarUrl || null,
          timezone,
          preferences,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      const updatedProfile = await response.json();
      setProfile(updatedProfile);
      setSuccess(true);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Error updating profile:", err);
      setError("Failed to save profile changes");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="container px-4 py-8">
          <div className="mx-auto max-w-4xl">
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">Loading profile...</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error && !profile) {
    return (
      <ProtectedRoute>
        <div className="container px-4 py-8">
          <div className="mx-auto max-w-4xl">
            <Callout variant="destructive">
              {error}
            </Callout>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="container px-4 py-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8 flex items-center gap-3">
            <User className="h-10 w-10 text-neon-purple" />
            <div>
              <h1 className="text-4xl font-bold">User Profile</h1>
              <p className="text-muted-foreground">
                Manage your account settings and preferences
              </p>
            </div>
          </div>

          {success && (
            <Callout variant="success" className="mb-6">
              Profile updated successfully!
            </Callout>
          )}

          {error && (
            <Callout variant="destructive" className="mb-6">
              {error}
            </Callout>
          )}

          <div className="space-y-6">
            {/* Account Information */}
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>
                  Your Discord account details (read-only)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Discord Username</Label>
                  <p className="text-base">{profile?.username || "N/A"}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Display Name</Label>
                  <p className="text-base">{profile?.globalName || "N/A"}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Account Created</Label>
                  <p className="text-base">
                    {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : "N/A"}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Profile Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Profile Settings
                </CardTitle>
                <CardDescription>
                  Customize your profile and preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSave} className="space-y-4">
                  <div>
                    <Label htmlFor="displayName">Custom Display Name</Label>
                    <Input
                      id="displayName"
                      type="text"
                      placeholder="Enter a custom display name"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="mt-1"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      Override your Discord display name (optional)
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="avatarUrl">Custom Avatar URL</Label>
                    <Input
                      id="avatarUrl"
                      type="url"
                      placeholder="https://example.com/avatar.png"
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                      className="mt-1"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      Override your Discord avatar (optional)
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="timezone">Timezone</Label>
                    <select
                      id="timezone"
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      {TIMEZONES.map((tz) => (
                        <option key={tz} value={tz}>
                          {tz}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Your local timezone for timestamp display
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="theme">Theme Preference</Label>
                    <select
                      id="theme"
                      value={theme}
                      onChange={(e) => setTheme(e.target.value)}
                      className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <option value="auto">Auto (System)</option>
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="defaultModel">Default AI Model</Label>
                    <Input
                      id="defaultModel"
                      type="text"
                      placeholder="e.g., gpt-4, claude-3-sonnet"
                      value={defaultModel}
                      onChange={(e) => setDefaultModel(e.target.value)}
                      className="mt-1"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      Your preferred default model for chat (optional)
                    </p>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button type="submit" disabled={saving}>
                      {saving ? "Saving..." : "Save Changes"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={fetchProfile}
                      disabled={saving}
                    >
                      Reset
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Saved Prompts Link */}
            <Card>
              <CardHeader>
                <CardTitle>Saved Prompts</CardTitle>
                <CardDescription>
                  Manage your favorite prompts and macros
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild>
                  <a href="/profile/prompts">Manage Saved Prompts</a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
