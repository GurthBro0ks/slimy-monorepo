"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
// import { useRouter } from "next/navigation"; // Unused for now
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
  botInstalled?: boolean;
  roleLabel?: "admin" | "club" | "member" | string;
  roleSource?: "roles" | "permissions" | "default" | string;
};

interface GuildListProps {
  className?: string;
}

export function GuildList({ className }: GuildListProps) {
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // const router = useRouter(); // Unused for now

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

      // Force a hard refresh/navigation to ensure context is updated
      window.location.href = '/club';
    } catch (err) {
      console.error(err);
    }
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
        {guilds.map((guild) => {
          const botInstalled = guild.botInstalled ?? guild.botInGuild ?? false;
          const roleLabel = (guild.roleLabel || "member") + "";
          return (
            <Card key={guild.id}>
            <CardHeader className="flex flex-row items-center gap-3">
              <GuildAvatar guild={guild} />
              <div>
                <CardTitle className="text-base">{guild.name}</CardTitle>
                <p className="text-xs text-muted-foreground">
                  Role: <span className="font-semibold">{roleLabel}</span>
                  {guild.roleSource ? (
                    <span className="opacity-70"> ({guild.roleSource})</span>
                  ) : null}
                </p>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground">
                ID: <span className="font-mono text-xs">{guild.id}</span>
              </p>
            </CardContent>
            <CardFooter>
              {botInstalled ? (
                <Button className="w-full" onClick={() => handleConnect(guild)}>
                  Dashboard
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  className="w-full opacity-50 cursor-not-allowed"
                  disabled
                  title="This bot is currently private."
                >
                  Invite Closed
                </Button>
              )}
            </CardFooter>
          </Card>
          );
        })}
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
