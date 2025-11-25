import type { Metadata } from "next";
import { CodesTerminalBlock } from "../_components/CodesTerminalBlock";
import { CommandShell } from "@/components/CommandShell";

export const metadata: Metadata = {
  title: "Live Super Snail Codes | slimy.ai",
  description:
    "Stream the latest Super Snail redemption codes directly from slimy.ai's Admin API without needing an account.",
};

export default function SnailCodesPage() {
  return (
    <CommandShell
      title="Super Snail Codes"
      breadcrumbs="Home / Snail / Codes"
      statusText="Terminal uplink: Active"
    >
      <section className="container px-4 py-12">
        <div className="mx-auto max-w-3xl text-center space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.5em] text-neon-green">
            Live Super Snail Codes
          </p>
          <h1 className="text-4xl font-bold">Live Super Snail Codes</h1>
          <p className="text-base text-muted-foreground">
            Cyberpunk terminal feed of every active code we are tracking across Reddit, Snelp, and
            trusted Admin API sources. Bookmark and refresh free of auth walls.
          </p>
        </div>

        <div className="mx-auto mt-10 max-w-4xl">
          <CodesTerminalBlock />
        </div>
      </section>
    </CommandShell>
  );
}

