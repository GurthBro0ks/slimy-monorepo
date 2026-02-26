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
const criticalPaths = ["/snail", "/club", "/login-landing"];

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();
  const [logoutLoading, setLogoutLoading] = React.useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const resolvedUser = user && (user as any).user ? (user as any).user : user;
  const role = (user as any)?.role ?? resolvedUser?.role;

  // Prefetch critical paths when user is authenticated
  React.useEffect(() => {
    if (resolvedUser && !isLoading) {
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
  }, [resolvedUser, isLoading, role, router]);

  // Close mobile menu on route change
  React.useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

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
      <header className="sticky top-0 z-50 w-full border-b bg-[#0d001a]">
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
            
            {/* Desktop Navigation */}
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
            
            {/* Desktop Auth Buttons */}
            <div className="hidden md:flex items-center gap-3">
              {isLoading ? (
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

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 text-white hover:text-neon-green transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {mobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-16 z-40 bg-[#0d001a] border-b border-white/10">
          <nav className="flex flex-col p-4 space-y-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                prefetch={item.prefetch}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-neon-green py-2",
                  pathname === item.href
                    ? "text-neon-green"
                    : "text-muted-foreground"
                )}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            
            {/* Mobile Auth Section */}
            <div className="pt-4 border-t border-white/10">
              {isLoading ? (
                <Skeleton className="h-8 w-full" />
              ) : resolvedUser ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {resolvedUser.email || resolvedUser.name}
                    </span>
                    {role && role !== "user" && (
                      <Badge variant={role as "admin" | "club" | "user"}>
                        {role.toUpperCase()}
                      </Badge>
                    )}
                  </div>
                  <Link
                    href={role === "admin" ? "/guilds" : role === "club" ? "/club" : "/snail"}
                    prefetch
                  >
                    <Button variant="neon" className="w-full">
                      Dashboard
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleLogout}
                    disabled={logoutLoading}
                  >
                    {logoutLoading ? "Logging out..." : "Logout"}
                  </Button>
                </div>
              ) : (
                <LoginButton className="w-full" />
              )}
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
