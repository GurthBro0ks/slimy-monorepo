"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Gamepad2, Server, Users, Globe } from "lucide-react";
import { useBedrockStatus } from "./useBedrockStatus";

export default function SlimeCraftPage() {
  const { status, isLoading, error } = useBedrockStatus();

  return (
    <div className="container px-4 py-16">
      {/* Hero Section */}
      <section className="mx-auto max-w-4xl text-center mb-16">
        <div className="mb-6 flex justify-center">
          <Gamepad2 className="h-20 w-20 text-neon-green" />
        </div>

        <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
          <span className="text-neon-green">slime.craft</span>
        </h1>

        <p className="mb-8 text-lg text-muted-foreground max-w-2xl mx-auto">
          A cross-platform Minecraft server where Java and Bedrock players unite.
          Build, explore, and create together in a community-driven world.
        </p>
      </section>

      {/* Server Status Section */}
      <section className="mx-auto max-w-4xl mb-16">
        <Card className="rounded-2xl border border-emerald-500/30 bg-zinc-900/40">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5 text-neon-green" />
                Server Status
              </CardTitle>
              {!isLoading && (
                <Badge
                  variant={status?.online ? "default" : "destructive"}
                  className={status?.online ? "bg-neon-green text-black" : ""}
                >
                  {status?.online ? "Online" : "Offline"}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading && (
              <p className="text-muted-foreground">Loading server status...</p>
            )}

            {error && (
              <div className="text-yellow-500">
                <p>Unable to fetch live status.</p>
                <p className="text-sm text-muted-foreground mt-1">{error}</p>
              </div>
            )}

            {status && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Players Online</p>
                  <p className="text-2xl font-bold text-neon-green">
                    {status.players?.online ?? 0} / {status.players?.max ?? 20}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Server Version</p>
                  <p className="text-lg font-semibold">
                    {status.version ?? "Unknown"}
                  </p>
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-zinc-700">
              <div className="flex items-start gap-2">
                <Globe className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-semibold">Server Address</p>
                  <p className="text-neon-green font-mono text-lg">mc.slimyai.xyz</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Default port (Java: 25565, Bedrock: 19132)
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* How to Join Section */}
      <section className="mx-auto max-w-4xl">
        <h2 className="mb-8 text-center text-3xl font-bold">How to Join</h2>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Java Edition */}
          <Card className="rounded-2xl border border-blue-500/30 bg-zinc-900/40 hover:bg-zinc-900/60 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gamepad2 className="h-6 w-6 text-blue-400" />
                Java Edition
              </CardTitle>
              <CardDescription>For PC players (Windows, Mac, Linux)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Launch Minecraft Java Edition</li>
                <li>Click on <strong>Multiplayer</strong></li>
                <li>Click <strong>Add Server</strong></li>
                <li>Enter server details:
                  <div className="ml-4 mt-1 p-2 bg-zinc-800 rounded font-mono text-xs">
                    <p>Server Name: slime.craft</p>
                    <p>Server Address: <span className="text-neon-green">mc.slimyai.xyz</span></p>
                  </div>
                </li>
                <li>Click <strong>Done</strong>, then join the server!</li>
              </ol>
            </CardContent>
          </Card>

          {/* Bedrock Edition */}
          <Card className="rounded-2xl border border-purple-500/30 bg-zinc-900/40 hover:bg-zinc-900/60 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-6 w-6 text-purple" />
                Bedrock Edition
              </CardTitle>
              <CardDescription>For Xbox, Switch, Mobile, Windows 10/11</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Launch Minecraft Bedrock Edition</li>
                <li>Go to <strong>Play</strong> tab</li>
                <li>Click <strong>Servers</strong> tab at the top</li>
                <li>Scroll down and click <strong>Add Server</strong></li>
                <li>Enter server details:
                  <div className="ml-4 mt-1 p-2 bg-zinc-800 rounded font-mono text-xs">
                    <p>Server Name: slime.craft</p>
                    <p>Server Address: <span className="text-neon-green">mc.slimyai.xyz</span></p>
                    <p>Port: <span className="text-neon-green">19132</span></p>
                  </div>
                </li>
                <li>Click <strong>Save</strong>, then join the server!</li>
              </ol>
              <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded">
                <p className="text-xs text-yellow-200">
                  <strong>Note:</strong> Console players may need to add the server through the Xbox app
                  or use third-party tools like BedrockConnect.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Community Section */}
      <section className="mx-auto max-w-4xl mt-16">
        <Card className="rounded-2xl border border-emerald-500/30 bg-zinc-900/40">
          <CardHeader>
            <CardTitle>Join the Community</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Connect with other players, get help, and stay updated on server events and updates.
              Join our Discord server to become part of the slime.craft community!
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
