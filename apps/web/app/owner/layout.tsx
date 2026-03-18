import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/server";
import { db as prisma } from "@/lib/db";
import { DebugDock } from "@/components/owner/debug-dock";
import { NotificationBell } from "@/components/owner/notification-drawer";

export const metadata = {
  title: "Owner Panel | Slimy AI",
  description: "Owner control panel for Slimy AI",
};

interface OwnerLayoutProps {
  children: React.ReactNode;
}

export default async function OwnerLayout({ children }: OwnerLayoutProps) {
  const user = await requireAuth();

  if (!user || user.role !== "owner") {
    redirect("/owner/forbidden");
  }

  // Fetch debug dock setting
  let debugDockEnabled = false;
  try {
    const settings = await prisma.appSettings.findFirst();
    debugDockEnabled = settings?.debugDockEnabled ?? false;
  } catch (err) {
    console.error("[OwnerLayout] Failed to fetch settings:", err);
  }

  return (
    <div className="min-h-screen bg-[var(--bg-deep)]">
      {/* Owner Panel Navigation */}
      <nav className="border-b border-purple-500/30 bg-black/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-6">
            <Link
              href="/"
              className="font-['Press Start 2P'] text-sm text-green-400 hover:text-green-300 transition-colors"
            >
              SLIMY
            </Link>

            <div className="flex items-center gap-4 flex-wrap justify-end">
              {/* Notifications Bell */}
              <NotificationBell />

              <Link
                href="/owner"
                className="px-3 py-2 text-xs font-['VT323'] text-purple-300 border border-purple-500/50 rounded hover:bg-purple-500/20 hover:border-purple-400 transition-all"
              >
                Dashboard
              </Link>
              <Link
                href="/owner/invites"
                className="px-3 py-2 text-xs font-['VT323'] text-purple-300 border border-purple-500/50 rounded hover:bg-purple-500/20 hover:border-purple-400 transition-all"
              >
                Invites
              </Link>
              <Link
                href="/owner/settings"
                className="px-3 py-2 text-xs font-['VT323'] text-purple-300 border border-purple-500/50 rounded hover:bg-purple-500/20 hover:border-purple-400 transition-all"
              >
                Settings
              </Link>
              <Link
                href="/owner/audit"
                className="px-3 py-2 text-xs font-['VT323'] text-purple-300 border border-purple-500/50 rounded hover:bg-purple-500/20 hover:border-purple-400 transition-all"
              >
                Audit
              </Link>
              <Link
                href="/dashboard"
                className="px-3 py-2 text-xs font-['VT323'] text-gray-400 border border-gray-500/30 rounded hover:bg-gray-500/10 hover:border-gray-400 transition-all"
              >
                Exit
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {children}
      </main>

      {/* Debug Dock - only render if enabled */}
      {debugDockEnabled && (
        <DebugDock
          isOwner={true}
          userEmail={user.email}
        />
      )}
    </div>
  );
}
