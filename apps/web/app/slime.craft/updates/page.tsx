"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Info, AlertTriangle, Pin } from "lucide-react";

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

export default function SlimecraftUpdatesPage() {
  const [updates, setUpdates] = useState<SlimecraftUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUpdates() {
      try {
        const res = await fetch("/api/slimecraft/updates/latest?limit=20");

        if (!res.ok) {
          throw new Error("Failed to fetch updates");
        }

        const data = await res.json();
        setUpdates(data.updates || []);
      } catch (err) {
        console.error("[Slimecraft Updates] Fetch error:", err);
        setError("Failed to load updates. Please try again later.");
      } finally {
        setLoading(false);
      }
    }

    fetchUpdates();
  }, []);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case "outage":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "warning":
        return <Badge className="bg-yellow-600">Warning</Badge>;
      case "outage":
        return <Badge variant="destructive">Outage</Badge>;
      case "info":
        return <Badge className="bg-blue-600">Info</Badge>;
      default:
        return <Badge variant="secondary">{type}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);
    } catch {
      return dateString;
    }
  };

  return (
    <div className="container px-4 py-16">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="mb-2 text-4xl font-bold">Slime.craft Updates</h1>
          <p className="text-muted-foreground">
            Server news, notices, and announcements
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
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {error && !loading && (
          <Card className="rounded-2xl border border-red-500/30 bg-zinc-900/40">
            <CardHeader>
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <CardTitle>Error</CardTitle>
              </div>
              <CardDescription>{error}</CardDescription>
            </CardHeader>
          </Card>
        )}

        {!loading && !error && updates.length === 0 && (
          <Card className="rounded-2xl border border-emerald-500/30 bg-zinc-900/40">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Info className="h-5 w-5 text-blue-500" />
                <CardTitle>No updates yet</CardTitle>
              </div>
              <CardDescription>
                Check back later for server updates and announcements.
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {!loading && !error && updates.length > 0 && (
          <div className="space-y-4">
            {updates.map((update) => (
              <Card
                key={update.id}
                className="rounded-2xl border border-emerald-500/30 bg-zinc-900/40 shadow-sm"
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      {getTypeIcon(update.type)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {update.pinned && (
                            <Pin className="h-4 w-4 text-emerald-500" />
                          )}
                          <CardTitle className="text-lg">
                            {update.title || "Server Update"}
                          </CardTitle>
                        </div>
                        <CardDescription className="text-xs sm:text-sm">
                          {formatDate(update.createdAt)}
                        </CardDescription>
                      </div>
                    </div>
                    {getTypeBadge(update.type)}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap text-sm text-foreground/90">
                    {update.body}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
