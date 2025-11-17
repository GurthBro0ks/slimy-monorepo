"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StatusPill } from "@/components/slimecraft/StatusPill";
import { Section } from "@/components/slimecraft/Section";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Gamepad2, Sparkles, Blocks } from "lucide-react";

interface ServerStatus {
  online: boolean;
  hostname?: string;
  port?: number;
  version?: string;
  players?: {
    online: number;
    max: number;
  };
  motd?: string;
  gamemode?: string;
  latency?: number;
  error?: string;
}

export default function SlimeCraftHomePage() {
  const [status, setStatus] = useState<ServerStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/bedrock-status");
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error("Failed to fetch server status:", error);
      setStatus({ online: false, error: "Failed to fetch status" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4">
            Welcome to <span className="text-neon-green">slime.craft</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-6">
            A chill Minecraft Bedrock server for creative builders and curious minds
          </p>

          {/* Server Status */}
          <div className="flex items-center justify-center gap-4 mb-8">
            {loading ? (
              <div className="text-muted-foreground">Loading status...</div>
            ) : status ? (
              <>
                <StatusPill online={status.online} />
                {status.players && (
                  <div className="text-sm text-muted-foreground">
                    <Users className="inline h-4 w-4 mr-1" />
                    {status.players.online}/{status.players.max} players
                  </div>
                )}
              </>
            ) : null}
          </div>

          {/* MOTD */}
          {status?.motd && (
            <p className="text-lg text-muted-foreground italic mb-6">
              "{status.motd}"
            </p>
          )}

          {/* CTA Buttons */}
          <div className="flex gap-4 justify-center">
            <Button asChild variant="purple" size="lg">
              <Link href="/slime.craft/how-to-join">Join the Server</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/slime.craft/rules">Read the Rules</Link>
            </Button>
          </div>
        </div>

        {/* What is slime.craft? */}
        <Section
          title="What is slime.craft?"
          subtitle="More than just another Minecraft server"
        >
          <Card className="border-emerald-500/30 bg-zinc-900/40">
            <CardContent className="pt-6">
              <p className="text-muted-foreground leading-relaxed">
                slime.craft is a Minecraft Bedrock Edition server designed for the Slimy.ai
                community. It's a place where creativity thrives, weird experiments are encouraged,
                and everyone can build at their own pace. Whether you're into massive redstone
                contraptions, cozy cottages, or abstract builds that defy explanation,
                you'll find a home here.
              </p>
            </CardContent>
          </Card>
        </Section>

        {/* Who it's for */}
        <Section
          title="Who it's for"
          subtitle="Find your vibe"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-emerald-500/30 bg-zinc-900/40 hover:bg-zinc-900/60 transition-colors">
              <CardHeader>
                <Blocks className="h-8 w-8 text-neon-green mb-2" />
                <CardTitle>Chill Builders</CardTitle>
                <CardDescription>
                  Take your time. Build what you love. No pressure, no deadlines.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-emerald-500/30 bg-zinc-900/40 hover:bg-zinc-900/60 transition-colors">
              <CardHeader>
                <Users className="h-8 w-8 text-neon-green mb-2" />
                <CardTitle>Friends & Community</CardTitle>
                <CardDescription>
                  Hang out, collaborate on builds, or just vibe together in Discord.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-emerald-500/30 bg-zinc-900/40 hover:bg-zinc-900/60 transition-colors">
              <CardHeader>
                <Sparkles className="h-8 w-8 text-neon-green mb-2" />
                <CardTitle>Weird Science</CardTitle>
                <CardDescription>
                  Test wild ideas. Break things (in-game). Learn. Experiment without limits.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-emerald-500/30 bg-zinc-900/40 hover:bg-zinc-900/60 transition-colors">
              <CardHeader>
                <Gamepad2 className="h-8 w-8 text-neon-green mb-2" />
                <CardTitle>Casual Gamers</CardTitle>
                <CardDescription>
                  Drop in whenever. No mandatory events. Play at your own rhythm.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </Section>

        {/* Quickstart */}
        <Section
          title="Quickstart"
          subtitle="Get started in 3 easy steps"
        >
          <Card className="border-emerald-500/30 bg-zinc-900/40">
            <CardContent className="pt-6">
              <ol className="space-y-4">
                <li className="flex gap-4">
                  <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-neon-green/20 text-neon-green font-bold">
                    1
                  </span>
                  <div>
                    <h3 className="font-semibold mb-1">Read the Rules</h3>
                    <p className="text-sm text-muted-foreground">
                      Check out our <Link href="/slime.craft/rules" className="text-neon-green hover:underline">server rules</Link> to
                      understand our community guidelines.
                    </p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-neon-green/20 text-neon-green font-bold">
                    2
                  </span>
                  <div>
                    <h3 className="font-semibold mb-1">Get Connection Info</h3>
                    <p className="text-sm text-muted-foreground">
                      Visit the <Link href="/slime.craft/how-to-join" className="text-neon-green hover:underline">How to Join</Link> page
                      for server IP, port, and detailed connection instructions.
                    </p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-neon-green/20 text-neon-green font-bold">
                    3
                  </span>
                  <div>
                    <h3 className="font-semibold mb-1">Join & Build</h3>
                    <p className="text-sm text-muted-foreground">
                      Connect to the server and start your adventure. Say hi in chat!
                    </p>
                  </div>
                </li>
              </ol>
            </CardContent>
          </Card>
        </Section>

        {/* Additional Info */}
        <div className="text-center mt-12 p-6 border border-emerald-500/30 rounded-lg bg-zinc-900/20">
          <p className="text-sm text-muted-foreground">
            Need help? Check the{" "}
            <Link href="/slime.craft/status" className="text-neon-green hover:underline">
              server status page
            </Link>{" "}
            or ask in Discord.
          </p>
        </div>
      </div>
    </div>
  );
}
