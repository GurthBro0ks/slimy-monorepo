"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Callout } from "@/components/ui/callout";
import { CardListSkeleton } from "@/components/ui/card-skeleton";
import { Shield, Users, MessageSquare, Settings } from "lucide-react";
import { ProtectedRoute } from "@/components/auth/protected-route";

interface Guild {
  id: string;
  name: string;
  memberCount: number;
  icon?: string;
}

export default function GuildsPage() {
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGuilds = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/guilds");
        if (response.ok) {
          const data = await response.json();
          setGuilds(data.guilds || []);
        } else {
          setError("Failed to load guilds. Please check Admin API connection.");
        }
      } catch (err) {
        setError("Failed to connect to Admin API.");
      } finally {
        setLoading(false);
      }
    };

    fetchGuilds();
  }, []);

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="container px-4 py-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex items-center gap-3">
            <Shield className="h-10 w-10 text-neon-purple" />
            <div>
              <h1 className="text-4xl font-bold">Admin Panel</h1>
              <p className="text-muted-foreground">
                Manage guilds and bot configuration
              </p>
            </div>
          </div>

          <Callout variant="info" className="mb-8">
            Connect Admin API to view and manage guilds. This page requires admin role.
          </Callout>

          {loading ? (
            <CardListSkeleton count={3} />
          ) : error ? (
            <Card className="rounded-2xl border border-emerald-500/30 bg-zinc-900/40">
              <CardHeader>
                <CardTitle>Guild Management</CardTitle>
                <CardDescription>
                  View and configure bot settings for all connected guilds
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{error}</p>
              </CardContent>
            </Card>
          ) : guilds.length > 0 ? (
            <div className="space-y-4">
              {guilds.map((guild) => (
                <Card
                  key={guild.id}
                  className="rounded-2xl border border-emerald-500/30 bg-zinc-900/40 hover:bg-zinc-900/60 transition-colors shadow-sm"
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {guild.icon ? (
                          <img
                            src={guild.icon}
                            alt={guild.name}
                            className="h-12 w-12 rounded-full"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-full bg-neon-purple/20 flex items-center justify-center">
                            <Shield className="h-6 w-6 text-neon-purple" />
                          </div>
                        )}
                        <div>
                          <CardTitle className="text-xl">{guild.name}</CardTitle>
                          <CardDescription className="flex items-center gap-2 mt-1">
                            <Users className="h-4 w-4" />
                            {guild.memberCount.toLocaleString()} members
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button className="p-2 rounded-lg hover:bg-zinc-800 transition-colors" title="Manage Settings">
                          <Settings className="h-5 w-5 text-muted-foreground" />
                        </button>
                        <button className="p-2 rounded-lg hover:bg-zinc-800 transition-colors" title="View Messages">
                          <MessageSquare className="h-5 w-5 text-muted-foreground" />
                        </button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="rounded-2xl border border-emerald-500/30 bg-zinc-900/40">
              <CardHeader>
                <CardTitle>Guild Management</CardTitle>
                <CardDescription>
                  View and configure bot settings for all connected guilds
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  No guilds found. Make sure the bot is connected to Discord servers.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
