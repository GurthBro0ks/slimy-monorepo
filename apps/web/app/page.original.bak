"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, BarChart3, MessageSquare, Shield } from "lucide-react";
import { useAuth } from "@/lib/auth/context";

export default function HomePage() {
  const { login } = useAuth();

  const features = [
    {
      icon: Bot,
      title: "Snail Tools",
      description: "Analyze screenshots, calculate tier costs, and access secret codes for Super Snail.",
    },
    {
      icon: BarChart3,
      title: "Club Analytics",
      description: "Track club performance, analyze member stats, and optimize strategies.",
    },
    {
      icon: MessageSquare,
      title: "Slime Chat",
      description: "AI-powered conversations with personality modes and context awareness.",
    },
    {
      icon: Shield,
      title: "Admin Panel",
      description: "Manage guilds, configure settings, and monitor bot health.",
    },
  ];

  return (
    <div className="container px-4 py-16">
      {/* Hero Section - Compact */}
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
        <p className="mb-8 text-base text-muted-foreground sm:text-lg">
          fueled by <span className="text-purple">adhd</span> — driven by <span className="text-neon-green">feet</span> — motivated by <span className="text-blue-400">ducks</span>
        </p>

        {/* CTA Button */}
        <Button variant="purple" size="lg" className="rounded-full" onClick={login}>
          <span className="md:hidden">Login</span>
          <span className="hidden md:inline">Login with Discord</span>
        </Button>
      </section>

      {/* Features Grid */}
      <section className="mx-auto mt-24 max-w-6xl">
        <h2 className="mb-12 text-center text-3xl font-bold">Powerful Features</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <Card key={feature.title} className="rounded-2xl border border-emerald-500/30 bg-zinc-900/40 hover:bg-zinc-900/60 transition-colors shadow-sm">
              <CardHeader>
                <feature.icon className="h-10 w-10 text-neon-green mb-2" />
                <CardTitle>{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
