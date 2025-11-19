import { Button } from "@/components/ui/button";
import { FeatureCard } from "../_components/FeatureCard";
import {
  Wrench,
  MessageSquare,
  Pickaxe,
  Shield,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export default function FrontDoorPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="container relative px-4 py-16 sm:py-24 lg:py-32">
        <div className="mx-auto max-w-4xl text-center">
          {/* Decorative glow effect */}
          <div className="absolute inset-0 -z-10 flex items-center justify-center">
            <div className="h-[300px] w-[300px] rounded-full bg-neon-green/10 blur-[100px]" />
          </div>

          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-zinc-900/40 px-4 py-2">
            <Sparkles className="h-4 w-4 text-neon-green" />
            <span className="text-sm text-muted-foreground">
              Welcome to Slimy.ai
            </span>
          </div>

          <h1 className="mb-6 text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Your{" "}
            <span className="bg-gradient-to-r from-neon-green to-lime-green bg-clip-text text-transparent">
              All-in-One
            </span>{" "}
            Discord Companion
          </h1>

          <p className="mb-8 text-lg text-muted-foreground sm:text-xl">
            Powerful tools, intelligent chat, Minecraft integration, and admin
            controls—all in one place. Built for communities that want more.
          </p>

          {/* Placeholder Auth Buttons */}
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              size="lg"
              variant="neon"
              className="group w-full sm:w-auto"
              onClick={() => {
                // TODO: Wire to real Discord OAuth
                console.log("Login with Discord clicked");
              }}
            >
              Login with Discord
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => {
                // TODO: Wire to real guest/demo mode
                console.log("Continue as Guest clicked");
              }}
            >
              Continue as Guest
            </Button>
          </div>

          {/* TODO Comment */}
          <p className="mt-4 text-xs text-muted-foreground">
            🚧 Auth buttons are UI-only placeholders. See TODO comments for
            wiring.
          </p>
        </div>
      </section>

      {/* Features Grid Section */}
      <section className="container px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-foreground">
              Everything You Need
            </h2>
            <p className="text-muted-foreground">
              Explore the features that make Slimy.ai your go-to platform
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* Snail Tools */}
            <FeatureCard
              title="Snail Tools"
              description="Discord bot utilities and productivity tools to supercharge your server."
              icon={Wrench}
              iconColor="text-neon-green"
            />

            {/* Slime Chat */}
            <FeatureCard
              title="Slime Chat"
              description="AI-powered chat assistant with memory and context awareness for your community."
              icon={MessageSquare}
              iconColor="text-purple"
            />

            {/* slime.craft */}
            <FeatureCard
              title="slime.craft"
              description="Minecraft server integration with stats, leaderboards, and player management."
              icon={Pickaxe}
              iconColor="text-lime-green"
            />

            {/* Admin */}
            <FeatureCard
              title="Admin"
              description="Advanced admin controls for moderation, analytics, and server configuration."
              icon={Shield}
              iconColor="text-dark-purple"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container px-4 py-16">
        <div className="mx-auto max-w-4xl rounded-2xl border border-emerald-500/30 bg-zinc-900/40 p-8 text-center sm:p-12">
          <h2 className="mb-4 text-2xl font-bold text-foreground sm:text-3xl">
            Ready to Get Started?
          </h2>
          <p className="mb-6 text-muted-foreground">
            Join thousands of communities already using Slimy.ai to level up
            their Discord servers.
          </p>
          <Button
            size="lg"
            variant="neon"
            onClick={() => {
              // TODO: Wire to dashboard or onboarding flow
              console.log("Get Started clicked");
            }}
          >
            Get Started
          </Button>
        </div>
      </section>
    </div>
  );
}
