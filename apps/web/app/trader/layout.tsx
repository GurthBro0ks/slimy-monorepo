import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { checkTraderAccess } from "@/lib/trader/access";
import { TraderProvider } from "@/lib/trader/context";
import { TraderShell } from "@/components/trader/TraderShell";

export const metadata = {
  title: "Trader | Slimy.ai",
  description: "Slimy Trader Dashboard - Shadow Mode",
};

// Public routes that don't require authentication
const PUBLIC_ROUTES = ["/trader/login", "/trader/register"];

export default async function TraderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get pathname from middleware header
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";

  // Skip auth for public routes (login, register)
  const isPublicRoute = PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  if (isPublicRoute) {
    // Render children directly without TraderShell for public routes
    return children;
  }

  // Protected routes require authentication
  const access = await checkTraderAccess();

  if (!access.authenticated) {
    // Redirect to trader-specific login, NOT the main app login
    redirect("/trader/login?returnTo=/trader");
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
