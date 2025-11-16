"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Skeleton } from "./ui/skeleton";
import { Button } from "./ui/button";
import { Clock, Code } from "lucide-react";
import { SnailEvent } from "@/lib/snail-events";
import Link from "next/link";

export function SnailTimeline() {
  const [events, setEvents] = useState<SnailEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEvents() {
      try {
        const response = await fetch("/api/snail/history");
        if (!response.ok) {
          throw new Error("Failed to fetch history");
        }
        const data = await response.json();
        setEvents(data.events);
      } catch (err) {
        setError("Could not load timeline events.");
        console.error("Timeline fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchEvents();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (error || events.length === 0) {
    return (
      <Card className="rounded-2xl border border-emerald-500/30 bg-zinc-900/40 shadow-sm">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Clock className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Timeline appears after your first Analyze</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Upload a screenshot or use the Snail Tools to get started
          </p>
          <Link href="/snail/codes">
            <Button variant="neon" size="sm">
              <Code className="h-4 w-4 mr-2" />
              Open Codes
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="relative border-l border-gray-700 ml-4 pl-4">
      {events.map((event) => (
        <div key={event.id} className="mb-8 flex items-start">
          {/* Timeline Dot */}
          <div className="absolute w-3 h-3 bg-neon-green rounded-full mt-1.5 -left-1.5 border border-gray-900" />

          <div className="flex-1">
            <time className="mb-1 text-sm font-normal leading-none text-gray-400">
              {new Date(event.timestamp).toLocaleString()}
            </time>
            <Card className="mt-2 rounded-2xl border border-emerald-500/30 bg-zinc-900/40 shadow-sm">
              <CardHeader className="py-2 px-4">
                <CardTitle className="text-lg font-semibold">{event.title}</CardTitle>
                <CardDescription className="text-xs">{event.type}</CardDescription>
              </CardHeader>
              <CardContent className="py-2 px-4">
                <p className="text-sm text-muted-foreground">{event.details}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      ))}
    </div>
  );
}
