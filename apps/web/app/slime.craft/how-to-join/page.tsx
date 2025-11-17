import { Section } from "@/components/slimecraft/Section";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Smartphone, Monitor, Info, Copy } from "lucide-react";

export default function HowToJoinPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4">
            How to <span className="text-neon-green">Join</span>
          </h1>
          <p className="text-xl text-muted-foreground">
            Connect to slime.craft and start your adventure
          </p>
        </div>

        {/* Server Information */}
        <Section title="Server Information">
          <Card className="border-emerald-500/30 bg-zinc-900/40">
            <CardContent className="pt-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Server Address</p>
                  <p className="text-2xl font-mono font-bold text-neon-green">slime.craft</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Port</p>
                  <p className="text-2xl font-mono font-bold text-neon-green">19132</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Edition</p>
                  <p className="text-lg font-semibold">Bedrock Edition</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Version</p>
                  <p className="text-lg font-semibold">1.21.3+</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Section>

        {/* Bedrock Connection Instructions */}
        <Section
          title="Bedrock Edition (Mobile, Console, Windows)"
          subtitle="Primary connection method"
        >
          <Card className="border-emerald-500/30 bg-zinc-900/40">
            <CardHeader>
              <Smartphone className="h-8 w-8 text-neon-green mb-2" />
              <CardTitle>Step-by-Step Instructions</CardTitle>
              <CardDescription>Works on iOS, Android, Xbox, PlayStation, Nintendo Switch, and Windows 10/11</CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="space-y-4">
                <li className="flex gap-4">
                  <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-neon-green/20 text-neon-green font-bold">
                    1
                  </span>
                  <div>
                    <h3 className="font-semibold mb-1">Open Minecraft Bedrock</h3>
                    <p className="text-sm text-muted-foreground">
                      Launch Minecraft on your device and wait for the main menu to load.
                    </p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-neon-green/20 text-neon-green font-bold">
                    2
                  </span>
                  <div>
                    <h3 className="font-semibold mb-1">Go to "Play" → "Servers"</h3>
                    <p className="text-sm text-muted-foreground">
                      Navigate to the Play menu, then select the Servers tab.
                    </p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-neon-green/20 text-neon-green font-bold">
                    3
                  </span>
                  <div>
                    <h3 className="font-semibold mb-1">Add Server</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      Scroll down and click "Add Server" at the bottom of the server list.
                    </p>
                    <div className="bg-zinc-950/50 p-3 rounded border border-emerald-500/20 text-sm space-y-1">
                      <div><span className="text-muted-foreground">Server Name:</span> <span className="text-neon-green font-mono">slime.craft</span></div>
                      <div><span className="text-muted-foreground">Server Address:</span> <span className="text-neon-green font-mono">slime.craft</span></div>
                      <div><span className="text-muted-foreground">Port:</span> <span className="text-neon-green font-mono">19132</span></div>
                    </div>
                  </div>
                </li>
                <li className="flex gap-4">
                  <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-neon-green/20 text-neon-green font-bold">
                    4
                  </span>
                  <div>
                    <h3 className="font-semibold mb-1">Save and Connect</h3>
                    <p className="text-sm text-muted-foreground">
                      Save the server, then click on it to join. Welcome to slime.craft!
                    </p>
                  </div>
                </li>
              </ol>
            </CardContent>
          </Card>
        </Section>

        {/* Java Edition Note */}
        <Section title="Java Edition">
          <Alert className="border-blue-500/30 bg-blue-500/10">
            <Monitor className="h-4 w-4" />
            <AlertTitle>Coming Soon</AlertTitle>
            <AlertDescription>
              Java Edition support is planned for a future update. For now, please use Bedrock Edition
              to connect to the server. Stay tuned for announcements!
            </AlertDescription>
          </Alert>
        </Section>

        {/* FAQ */}
        <Section title="Frequently Asked Questions">
          <div className="space-y-4">
            <Card className="border-emerald-500/30 bg-zinc-900/40">
              <CardHeader>
                <CardTitle className="text-lg">Do I need mods to join?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  No! slime.craft is a vanilla Bedrock server. You can join with a standard,
                  unmodified Minecraft client. However, optional resource packs may be available
                  for download if you want enhanced visuals.
                </p>
              </CardContent>
            </Card>

            <Card className="border-emerald-500/30 bg-zinc-900/40">
              <CardHeader>
                <CardTitle className="text-lg">Is this server whitelisted?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Currently, the server is open to all members of the Slimy.ai community.
                  We may implement a whitelist in the future if needed to maintain server quality
                  and performance. Check our Discord for the latest information.
                </p>
              </CardContent>
            </Card>

            <Card className="border-emerald-500/30 bg-zinc-900/40">
              <CardHeader>
                <CardTitle className="text-lg">Will there be world resets?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  We aim to keep the world persistent for as long as possible. Major version
                  updates or technical issues may require resets, but we'll always announce
                  these well in advance and provide world downloads when possible.
                </p>
              </CardContent>
            </Card>

            <Card className="border-emerald-500/30 bg-zinc-900/40">
              <CardHeader>
                <CardTitle className="text-lg">Can I play on multiple devices?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Yes! As long as you're using the same Microsoft/Xbox account, your progress
                  will sync across all your Bedrock Edition devices (mobile, console, PC).
                </p>
              </CardContent>
            </Card>

            <Card className="border-emerald-500/30 bg-zinc-900/40">
              <CardHeader>
                <CardTitle className="text-lg">I can't connect. What should I do?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-2">
                  First, check the <a href="/slime.craft/status" className="text-neon-green hover:underline">server status page</a> to
                  make sure the server is online. If it's online but you still can't connect:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                  <li>Verify you entered the correct address and port</li>
                  <li>Check your internet connection</li>
                  <li>Restart Minecraft</li>
                  <li>Make sure your Minecraft version is up to date</li>
                  <li>Ask for help in our Discord server</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </Section>

        {/* Help Section */}
        <div className="mt-12 p-6 border border-emerald-500/30 rounded-lg bg-zinc-900/20 text-center">
          <Info className="h-6 w-6 text-neon-green mx-auto mb-3" />
          <h3 className="font-semibold mb-2">Need More Help?</h3>
          <p className="text-sm text-muted-foreground">
            Join our Discord community for real-time support and to connect with other players!
          </p>
        </div>
      </div>
    </div>
  );
}
