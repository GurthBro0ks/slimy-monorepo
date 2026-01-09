import { redirect } from "next/navigation";
import { checkTraderAccess } from "@/lib/trader/access";
import { TraderProvider } from "@/lib/trader/context";
import { TraderShell } from "@/components/trader/TraderShell";

export const metadata = {
  title: "Trader | Slimy.ai",
  description: "Slimy Trader Dashboard - Shadow Mode",
};

export default async function TraderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const access = await checkTraderAccess();

  if (!access.authenticated) {
    redirect("/api/auth/login?returnTo=/trader");
  }

  if (!access.hasAccess) {
    redirect("/trader/forbidden");
  }

  return (
    <TraderProvider initialMode="shadow">
      <TraderShell username={access.username || "Unknown"}>
        {children}
      </TraderShell>
    </TraderProvider>
  );
}
