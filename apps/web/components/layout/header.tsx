"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth/context";
import { UsageBadge } from "@/components/usage-badge";

import { LoginButton } from "@/components/auth/login-button";
import { UserNav } from "@/components/auth/user-nav";

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
  const { user, loading, logout } = useAuth();
  const [logoutLoading, setLogoutLoading] = React.useState(false);

  const resolvedUser = user && (user as any).user ? (user as any).user : user;
  const role = (user as any)?.role ?? resolvedUser?.role;

  // Prefetch critical paths when user is authenticated
  React.useEffect(() => {
    if (resolvedUser && !loading) {
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
  }, [resolvedUser, loading, role, router]);

  const handleLogout = async () => {
    setLogoutLoading(true);
    try {
      await logout();
    } finally {
      // Reset loading state after a short delay to show feedback
      setTimeout(() => setLogoutLoading(false), 1000);
    }
  };

  return (
    <>
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
            ) : resolvedUser ? (
              <div className="flex items-center gap-3 flex-wrap justify-end">
                <UserNav
                  user={{ ...resolvedUser, role: role || resolvedUser.role }}
                  onLogout={handleLogout}
                  loading={logoutLoading}
                />
                {role && role !== "user" && (
                  <Badge variant={role as "admin" | "club" | "user"}>
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
              </div>
            ) : (
              <LoginButton />
            )}
          </div>
        </div>
      </header>
    </>
  );
}
