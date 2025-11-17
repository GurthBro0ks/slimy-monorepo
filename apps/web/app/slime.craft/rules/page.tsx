import { Section } from "@/components/slimecraft/Section";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Shield, Heart, Hammer, MessageCircle, Zap, Scale } from "lucide-react";

export default function RulesPage() {
  const rules = [
    {
      icon: Heart,
      title: "Be Respectful",
      description:
        "Treat everyone with kindness and respect. No harassment, hate speech, discrimination, or toxic behavior of any kind.",
    },
    {
      icon: Shield,
      title: "No Griefing or Stealing",
      description:
        "Don't destroy or take what isn't yours. If you didn't build it and don't have permission, don't touch it. This includes pranks that cause destruction.",
    },
    {
      icon: Hammer,
      title: "Build Responsibly",
      description:
        "Be mindful of where you build. Don't build too close to others without permission. Keep spawn areas clean and accessible.",
    },
    {
      icon: MessageCircle,
      title: "Keep Chat Clean",
      description:
        "No spamming, excessive caps, or inappropriate content in chat. Keep conversations friendly and welcoming for all ages.",
    },
    {
      icon: Zap,
      title: "No Cheating or Exploits",
      description:
        "Don't use hacked clients, x-ray, duplication glitches, or other exploits. Play fair and report bugs instead of abusing them.",
    },
    {
      icon: Scale,
      title: "Use Common Sense",
      description:
        "If something seems like it would ruin the experience for others, don't do it. When in doubt, ask an admin.",
    },
  ];

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4">
            Server <span className="text-neon-green">Rules</span>
          </h1>
          <p className="text-xl text-muted-foreground">
            Simple guidelines to keep slime.craft fun for everyone
          </p>
        </div>

        {/* Introduction */}
        <Alert className="border-emerald-500/30 bg-emerald-500/10 mb-8">
          <Shield className="h-4 w-4" />
          <AlertTitle>Our Philosophy</AlertTitle>
          <AlertDescription>
            slime.craft is built on trust and mutual respect. We're here to have fun, build cool
            things, and hang out with friends. These rules help maintain that vibe.
          </AlertDescription>
        </Alert>

        {/* Core Rules */}
        <Section title="Core Rules" subtitle="The essentials everyone should follow">
          <div className="grid gap-4 md:grid-cols-2">
            {rules.map((rule) => (
              <Card
                key={rule.title}
                className="border-emerald-500/30 bg-zinc-900/40 hover:bg-zinc-900/60 transition-colors"
              >
                <CardHeader>
                  <rule.icon className="h-8 w-8 text-neon-green mb-2" />
                  <CardTitle className="text-lg">{rule.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm">{rule.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </Section>

        {/* Building Etiquette */}
        <Section title="Building Etiquette" subtitle="Guidelines for shared spaces">
          <Card className="border-emerald-500/30 bg-zinc-900/40">
            <CardContent className="pt-6">
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex gap-3">
                  <span className="text-neon-green">•</span>
                  <span>
                    <strong>Spacing:</strong> Leave at least 100 blocks between your builds and
                    others' unless you have permission to build closer.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-neon-green">•</span>
                  <span>
                    <strong>Aesthetics:</strong> While we encourage creativity, try to keep builds
                    that are visible from common areas looking decent. No 1x1 cobblestone towers!
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-neon-green">•</span>
                  <span>
                    <strong>Farms:</strong> Large farms (mob grinders, crop farms, etc.) should be
                    built away from residential areas to avoid lag and noise.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-neon-green">•</span>
                  <span>
                    <strong>Unfinished builds:</strong> It's okay to have work-in-progress builds,
                    but please don't abandon half-finished structures indefinitely.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-neon-green">•</span>
                  <span>
                    <strong>Resource gathering:</strong> Don't strip-mine near spawn or residential
                    areas. Replant trees, fill in creeper holes, and be considerate.
                  </span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </Section>

        {/* Community Resources */}
        <Section title="Community Resources" subtitle="Shared spaces and items">
          <Card className="border-emerald-500/30 bg-zinc-900/40">
            <CardContent className="pt-6">
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex gap-3">
                  <span className="text-neon-green">•</span>
                  <span>
                    Community farms and resource areas are for everyone. Take what you need, but
                    leave some for others.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-neon-green">•</span>
                  <span>
                    If you use the last of something from a community chest, please restock it if
                    you can.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-neon-green">•</span>
                  <span>
                    Help maintain shared infrastructure like roads, railways, and public farms.
                  </span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </Section>

        {/* Admin Notes */}
        <Section title="Admin Notes" subtitle="Enforcement and moderation">
          <Card className="border-blue-500/30 bg-zinc-900/40">
            <CardContent className="pt-6">
              <div className="space-y-4 text-muted-foreground">
                <p>
                  <strong className="text-foreground">Enforcement:</strong> We prefer to handle
                  issues through conversation first. Most rule violations are accidents or
                  misunderstandings. However, repeated or serious violations may result in
                  temporary bans or removal from the server.
                </p>
                <p>
                  <strong className="text-foreground">Reporting:</strong> If you see someone
                  breaking the rules, please let an admin know in Discord. Include screenshots if
                  possible.
                </p>
                <p>
                  <strong className="text-foreground">Appeals:</strong> If you've been banned and
                  want to appeal, reach out to an admin in Discord. We're reasonable people.
                </p>
                <p>
                  <strong className="text-foreground">Admin discretion:</strong> Admins have final
                  say in rule interpretation and enforcement. We'll always try to be fair and
                  transparent.
                </p>
              </div>
            </CardContent>
          </Card>
        </Section>

        {/* Version Footer */}
        <div className="mt-12 p-6 border border-emerald-500/30 rounded-lg bg-zinc-900/20 text-center">
          <p className="text-sm text-muted-foreground mb-2">
            These rules may be updated as the server grows and evolves.
          </p>
          <p className="text-xs text-muted-foreground">
            <strong>Version:</strong> Rules v1.0 (November 2024)
          </p>
        </div>

        {/* Bottom CTA */}
        <div className="mt-8 text-center">
          <p className="text-muted-foreground">
            Ready to play?{" "}
            <a href="/slime.craft/how-to-join" className="text-neon-green hover:underline font-semibold">
              Learn how to join →
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
