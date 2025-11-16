"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth/context";
import { UsageBadge } from "@/components/usage-badge";
import { LogOut, Loader2 } from "lucide-react";

const navItems = [
  { href: "/", label: "Home", prefetch: true },
  { href: "/features", label: "Features", prefetch: true },
  { href: "/docs", label: "Docs", prefetch: true },
  { href: "/status", label: "Status", prefetch: false },
];

// Critical paths to prefetch on mount (for authenticated users)
const criticalPaths = ["/snail", "/club", "/chat"];

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, login, logout } = useAuth();
  const role = user?.role;
  const [authActionLoading, setAuthActionLoading] = React.useState(false);

  // Prefetch critical paths when user is authenticated
  React.useEffect(() => {
    if (user && !loading) {
      // Prefetch dashboard based on role
      const dashboardPath = role === "admin" ? "/guilds" : role === "club" ? "/club" : "/snail";
      router.prefetch(dashboardPath);
      
      // Prefetch other critical paths
      criticalPaths.forEach(path => {
        if (path !== dashboardPath) {
          router.prefetch(path);
        }
      });
    }
  }, [user, loading, role, router]);

  const handleLogin = async () => {
    setAuthActionLoading(true);
    try {
      login();
    } finally {
      // Reset loading state after a short delay to show feedback
      setTimeout(() => setAuthActionLoading(false), 1000);
    }
  };

  const handleLogout = async () => {
    setAuthActionLoading(true);
    try {
      logout();
    } finally {
      // Reset loading state after a short delay to show feedback
      setTimeout(() => setAuthActionLoading(false), 1000);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center space-x-2" prefetch>
            <Image 
              src="/images/logo.svg" 
              alt="slimy.ai Logo" 
              width={40} 
              height={40}
              className="w-10 h-10"
            />
            <span className="text-2xl font-bold text-neon-green">slimy.ai</span>
          </Link>
          <nav className="hidden md:flex gap-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                prefetch={item.prefetch}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-neon-green",
                  pathname === item.href
                    ? "text-neon-green"
                    : "text-muted-foreground"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <UsageBadge />
          {loading ? (
            <Skeleton className="h-8 w-24" />
          ) : user ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground hidden sm:inline">
                {user.name}
              </span>
              {role && role !== "user" && (
                <Badge variant={role as "admin" | "club"}>
                  {role.toUpperCase()}
                </Badge>
              )}
              <Link 
                href={role === "admin" ? "/guilds" : role === "club" ? "/club" : "/snail"}
                prefetch
              >
                <Button variant="neon" size="sm">
                  Dashboard
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                disabled={authActionLoading}
                className="text-muted-foreground hover:text-foreground"
              >
                {authActionLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LogOut className="h-4 w-4" />
                )}
                <span className="ml-1 hidden sm:inline">
                  {authActionLoading ? "Logging out..." : "Logout"}
                </span>
              </Button>
            </div>
          ) : (
            <Button
              variant="neon"
              size="sm"
              onClick={handleLogin}
              disabled={authActionLoading}
            >
              {authActionLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span className="md:hidden">Loading...</span>
                  <span className="hidden md:inline">Connecting...</span>
                </>
              ) : (
                <>
                  <span className="md:hidden">Login</span>
                  <span className="hidden md:inline">Login with Discord</span>
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
