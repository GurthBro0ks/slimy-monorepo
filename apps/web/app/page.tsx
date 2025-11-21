"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, BarChart3, MessageSquare, Code2, ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/auth/context";

export default function HomePage() {
  const { user, login } = useAuth();

  const features = [
    {
      icon: MessageSquare,
      title: "Slime Chat",
      description: "AI-powered conversations with personality modes and context awareness. No login required.",
      href: "/chat",
      badge: "Public",
    },
    {
      icon: Code2,
      title: "Snail Codes",
      description: "Access secret codes, redeem rewards, and unlock special features for Super Snail.",
      href: "/snail/codes",
      badge: "Protected",
    },
    {
      icon: BarChart3,
      title: "Club Analytics",
      description: "Track club performance, analyze member stats, and optimize strategies.",
      href: "/club",
      badge: "Club Only",
      requiresRole: "club" as const,
    },
    {
      icon: Bot,
      title: "Snail Tools",
      description: "Comprehensive Super Snail utilities, calculators, and game data.",
      href: "/snail",
      badge: "Protected",
    },
  ];

  return (
    <div className="container px-4 py-16">
      {/* Hero Section */}
      <section className="mx-auto max-w-2xl text-center mb-24">
        {/* Logo */}
        <div className="mb-6 flex justify-center">
          <Image
            src="/images/logo.svg"
            alt="slimy.ai Logo"
            width={100}
            height={100}
            className="w-20 h-20 sm:w-24 sm:h-24"
          />
        </div>

        {/* Main Heading */}
        <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
          <span className="text-neon-green">slimy.ai</span>
        </h1>

        {/* Subhead */}
        <h2 className="mb-8 text-2xl font-semibold bg-gradient-to-r from-blue-400 to-neon-green bg-clip-text text-transparent sm:text-3xl">
          Panel of Power
        </h2>

        {/* Tagline */}
        <p className="mb-4 text-base text-muted-foreground sm:text-lg">
          Discord-first Supersnail tools: codes, stats, screenshots, and club analytics in one place.
        </p>
        <p className="mb-8 text-sm text-muted-foreground">
          fueled by <span className="text-purple">adhd</span> — driven by <span className="text-neon-green">feet</span> — motivated by <span className="text-blue-400">ducks</span>
        </p>

        {/* CTA Button - Auth-aware */}
        {user ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Welcome back, <span className="text-neon-green font-semibold">{user.name}</span>!
            </p>
            <Link href="/snail/codes">
              <Button variant="neon" size="lg" className="rounded-full group">
                Open Dashboard
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        ) : (
          <Button variant="neon" size="lg" className="rounded-full" onClick={login}>
            <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
            </svg>
            <span className="md:hidden">Login</span>
            <span className="hidden md:inline">Login with Discord</span>
          </Button>
        )}
      </section>

      {/* Features Grid */}
      <section className="mx-auto mt-24 max-w-6xl">
        <h2 className="mb-12 text-center text-3xl font-bold">Powerful Features</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => {
            // Hide club-only features if user doesn't have access
            if (feature.requiresRole && (!user || (user.role !== feature.requiresRole && user.role !== "admin"))) {
              return null;
            }

            return (
              <Link key={feature.title} href={feature.href}>
                <Card className="h-full rounded-2xl border border-emerald-500/30 bg-zinc-900/40 hover:bg-zinc-900/60 hover:border-neon-green/50 transition-all shadow-sm group cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <feature.icon className="h-10 w-10 text-neon-green group-hover:scale-110 transition-transform" />
                      <span className="text-xs px-2 py-1 rounded-full bg-zinc-800 text-muted-foreground border border-zinc-700">
                        {feature.badge}
                      </span>
                    </div>
                    <CardTitle className="group-hover:text-neon-green transition-colors">
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Backend Status Section */}
      <section className="mx-auto mt-16 max-w-2xl">
        <Card className="border-emerald-500/20 bg-zinc-900/20">
          <CardHeader>
            <CardTitle className="text-lg text-center">Backend Status</CardTitle>
          </CardHeader>
          <CardContent className="text-center text-sm text-muted-foreground">
            <p className="mb-2">
              In <span className="text-neon-green font-semibold">sandbox mode</span>, all data is mock-only and safe to test.
            </p>
            <p className="text-xs">
              Configure <code className="text-purple bg-zinc-800 px-2 py-1 rounded">NEXT_PUBLIC_ADMIN_API_BASE</code> to connect to live backend.
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
