import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function SlimeCraftPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="text-4xl font-bold mb-6 text-neon-green">
          slime.craft
        </h1>
        <p className="text-lg text-muted-foreground mb-8">
          A Minecraft Bedrock server for chill builds, weird science, and good vibes.
        </p>
        <div className="flex gap-4 justify-center">
          <Button asChild variant="purple" size="lg">
            <Link href="/slime.craft/home">
              Explore Server
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
