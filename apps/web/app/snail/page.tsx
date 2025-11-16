import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Image, BarChart3, Code, HelpCircle, Calculator, Clock } from "lucide-react";
import { LazySnailTimeline } from "@/components/lazy";
import { Suspense } from "react";
import { LoadingFallback } from "@/lib/lazy";

export default function SnailPage() {
  const tools = [
    {
      icon: Code,
      title: "Secret Codes",
      description: "Access all active codes aggregated from Snelp and Reddit",
      href: "/snail/codes",
      available: true,
    },
    {
      icon: Image,
      title: "Analyze Screenshot",
      description: "Upload Super Snail screenshots for AI-powered analysis",
      href: "/snail/analyze",
      available: false,
    },
    {
      icon: BarChart3,
      title: "Stats Tracking",
      description: "View your historical stats and progress over time",
      href: "/snail/stats",
      available: false,
    },
    {
      icon: Calculator,
      title: "Tier Calculator",
      description: "Calculate upgrade costs and resource requirements",
      href: "/snail/calc",
      available: false,
    },
    {
      icon: HelpCircle,
      title: "Help & Guides",
      description: "Tips, tricks, and guides for Super Snail",
      href: "/snail/help",
      available: false,
    },
  ];

  return (
    <div className="container px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="mb-2 text-4xl font-bold">Snail Dashboard</h1>
          <p className="text-muted-foreground">
            Your personalized Super Snail command center
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold mb-4 flex items-center">
              <Clock className="h-6 w-6 mr-2 text-neon-green" />
              Snail Timeline
            </h2>
            <Card className="p-6 h-[500px] overflow-y-auto rounded-2xl border border-emerald-500/30 bg-zinc-900/40 shadow-sm">
              <Suspense fallback={<LoadingFallback height="400px" />}>
                <LazySnailTimeline />
              </Suspense>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <h2 className="text-2xl font-bold mb-4">Quick Tools</h2>
            <Callout variant="note" className="mb-4 text-sm">
              Connect Admin API to enable all features. Some tools are currently in development.
            </Callout>

            <div className="grid gap-4">
              {tools.map((tool) => (
                <Card
                  key={tool.title}
                  className={
                    tool.available
                      ? "rounded-2xl border border-emerald-500/30 bg-zinc-900/40 hover:bg-zinc-900/60 transition-colors shadow-sm"
                      : "rounded-2xl border border-emerald-500/30 bg-zinc-900/40 shadow-sm opacity-60"
                  }
                >
                  <CardHeader className="p-4">
                    <tool.icon className="h-8 w-8 text-neon-green mb-2" />
                    <CardTitle className="text-base">{tool.title}</CardTitle>
                    <CardDescription className="text-xs">{tool.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    {tool.available ? (
                      <Link href={tool.href}>
                        <Button variant="neon" size="sm" className="w-full">
                          Open Tool
                        </Button>
                      </Link>
                    ) : (
                      <Button variant="outline" size="sm" className="w-full" disabled aria-disabled="true">
                        Coming Soon
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
