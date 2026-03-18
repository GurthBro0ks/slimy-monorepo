import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, BarChart3, MessageSquare, Shield, Image, FileText, Code, Zap } from "lucide-react";

export default function FeaturesPage() {
  const features = [
    {
      icon: Bot,
      title: "Personal Snail Tools",
      description: "Comprehensive toolkit for Super Snail players",
      link: "/snail",
      items: [
        "Screenshot analysis with GPT-4 Vision",
        "Tier cost calculator with resource optimization",
        "Stats tracking and history",
        "Progress tracking and historical cost analysis",
      ],
    },
    {
      icon: Code,
      title: "Snail Codes",
      description: "Access secret codes and rewards",
      link: "/snail/codes",
      items: [
        "Secret codes aggregator (Snelp + Reddit)",
        "Automatic code updates",
        "Code validation and tracking",
        "Reward history",
      ],
    },
    {
      icon: BarChart3,
      title: "Club Analytics",
      description: "Advanced analytics for club management",
      link: "/club",
      items: [
        "Member performance tracking",
        "Upload and analyze club screenshots",
        "Historical stats comparison",
        "Export data to Google Sheets",
      ],
    },
    {
      icon: MessageSquare,
      title: "Slime Chat & Image Generation",
      description: "AI-powered conversational assistant and image creation",
      link: "/chat",
      items: [
        "4 personality modes (mentor, partner, mirror, operator)",
        "Context-aware responses with memory system",
        "10 artistic styles for image generation",
        "DALL-E 3 integration with rate limiting",
      ],
    },
    {
      icon: Shield,
      title: "Admin Panel",
      description: "Powerful management tools for admins",
      link: "/admin",
      items: [
        "Multi-guild management",
        "Role-based access control",
        "Bot health diagnostics",
        "Configuration management",
      ],
    },
    {
      icon: FileText,
      title: "Memory System",
      description: "Persistent memory and context",
      link: "/docs",
      items: [
        "Server-wide consent management",
        "Tag-based organization",
        "Context tracking (channel, timestamp)",
        "Export as JSON",
      ],
    },
  ];

  return (
    <div className="container px-4 py-16">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
            Features
          </h1>
          <p className="text-xl text-muted-foreground">
            Everything you need to enhance your Super Snail experience
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {features.map((feature) => (
            <Link key={feature.title} href={feature.link}>
              <Card className="h-full rounded-2xl border border-emerald-500/30 bg-zinc-900/40 hover:bg-zinc-900/60 hover:border-emerald-500/50 transition-all shadow-sm group">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <feature.icon className="h-8 w-8 text-neon-green group-hover:drop-shadow-[0_0_8px_rgba(16,185,129,0.8)] transition-all" />
                    <div>
                      <CardTitle className="group-hover:text-neon-green group-hover:drop-shadow-[0_0_8px_rgba(16,185,129,0.6)] transition-all">
                        {feature.title}
                      </CardTitle>
                      <CardDescription>{feature.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {feature.items.map((item, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="text-neon-green">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
