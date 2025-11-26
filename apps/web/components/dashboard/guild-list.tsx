"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type Guild = {
  id: string;
  name: string;
  icon?: string | null;
  permissions?: string | number | null;
  botInGuild?: boolean;
};

interface GuildListProps {
  className?: string;
}

export function GuildList({ className }: GuildListProps) {
  const discordClientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID;
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleConnect = async (guild: Guild) => {
    try {
      const res = await fetch("/api/guilds/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guildId: guild.id,
          name: guild.name,
          icon: guild.icon,
        }),
      });

      if (!res.ok) throw new Error("Failed to connect");

      router.push(`/dashboard/${guild.id}`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleInvite = (guild: Guild) => {
    if (!discordClientId) {
      setError("Discord client ID is not configured. Please set NEXT_PUBLIC_DISCORD_CLIENT_ID.");
      return;
    }

    const url = `https://discord.com/api/oauth2/authorize?client_id=${discordClientId}&permissions=8&scope=bot&guild_id=${guild.id}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch("/api/discord/guilds", {
          credentials: "include",
        });

        if (!res.ok) {
          throw new Error(`Failed to load guilds (${res.status})`);
        }

        const data = await res.json();
        if (!cancelled) {
          setGuilds(Array.isArray(data.guilds) ? data.guilds : []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unable to load guilds");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, idx) => (
            <Card key={idx}>
              <CardHeader className="flex flex-row items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2 w-full">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      );
    }

    if (!guilds.length) {
      return (
        <div className="rounded-md border px-4 py-3 text-sm text-muted-foreground">
          No Discord servers found. Try reconnecting your account.
        </div>
      );
    }

    return (
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {guilds.map((guild) => (
          <Card key={guild.id}>
            <CardHeader className="flex flex-row items-center gap-3">
              <GuildAvatar guild={guild} />
              <div>
                <CardTitle className="text-base">{guild.name}</CardTitle>
                {guild.permissions && (
                  <p className="text-xs text-muted-foreground">
                    Permissions: {guild.permissions}
                  </p>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground">
                ID: <span className="font-mono text-xs">{guild.id}</span>
              </p>
            </CardContent>
            <CardFooter>
              {guild.botInGuild ? (
                <Button className="w-full" onClick={() => handleConnect(guild)}>
                  Dashboard
                </Button>
              ) : (
                <Button variant="secondary" className="w-full" onClick={() => handleInvite(guild)}>
                  Setup
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <section className={cn("space-y-4", className)}>
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">Your Discord Servers</h2>
        <p className="text-sm text-muted-foreground">
          Servers where you can administer settings. Invite the bot or jump straight to the dashboard.
        </p>
      </div>
      {renderContent()}
    </section>
  );
}

function GuildAvatar({ guild }: { guild: Guild }) {
  const iconUrl = guild.icon
    ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`
    : null;

  if (!iconUrl) {
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground">
        {guild.name?.charAt(0).toUpperCase()}
      </div>
    );
  }

  return (
    <div className="relative h-10 w-10 overflow-hidden rounded-full bg-muted">
      <Image
        src={iconUrl}
        alt={guild.name}
        fill
        sizes="40px"
        className="object-cover"
      />
    </div>
  );
}
