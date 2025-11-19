"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { RoleIndicator } from "../_components/RoleIndicator";
import {
  Home,
  Wrench,
  MessageSquare,
  Pickaxe,
  Shield,
  Menu,
  X,
  User,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // TODO: Replace with real user from auth context
  const mockUser = {
    name: "Demo User",
    avatar: null,
    role: "admin" as const, // Change to 'club' or 'user' to test different roles
    isAdmin: true, // TODO: Wire to real auth/permissions
  };

  const navItems = [
    { name: "Dashboard", href: "/labs/dashboard", icon: Home },
    { name: "Snail Tools", href: "/labs/dashboard/snail", icon: Wrench },
    {
      name: "Slime Chat",
      href: "/labs/dashboard/chat",
      icon: MessageSquare,
    },
    {
      name: "slime.craft",
      href: "/labs/dashboard/minecraft",
      icon: Pickaxe,
    },
    ...(mockUser.isAdmin
      ? [{ name: "Admin", href: "/labs/dashboard/admin", icon: Shield }]
      : []),
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar - Desktop */}
      <aside className="hidden w-64 flex-col border-r border-zinc-800 bg-zinc-900/40 lg:flex">
        <div className="flex h-16 items-center border-b border-zinc-800 px-6">
          <Link href="/labs/frontdoor" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-neon-green to-lime-green" />
            <span className="text-lg font-bold text-foreground">Slimy.ai</span>
          </Link>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  "text-muted-foreground hover:bg-zinc-800/50 hover:text-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="border-t border-zinc-800 p-4">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800">
              <User className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">
                {mockUser.name}
              </p>
              <RoleIndicator role={mockUser.role} className="mt-1" />
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start"
            size="sm"
            onClick={() => {
              // TODO: Wire to real logout
              console.log("Logout clicked");
            }}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-64 flex-col border-r border-zinc-800 bg-zinc-900 lg:hidden">
            <div className="flex h-16 items-center justify-between border-b border-zinc-800 px-6">
              <Link
                href="/labs/frontdoor"
                className="flex items-center gap-2"
                onClick={() => setSidebarOpen(false)}
              >
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-neon-green to-lime-green" />
                <span className="text-lg font-bold text-foreground">
                  Slimy.ai
                </span>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <nav className="flex-1 space-y-1 p-4">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      "text-muted-foreground hover:bg-zinc-800/50 hover:text-foreground"
                    )}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            <div className="border-t border-zinc-800 p-4">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800">
                  <User className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {mockUser.name}
                  </p>
                  <RoleIndicator role={mockUser.role} className="mt-1" />
                </div>
              </div>
              <Button
                variant="ghost"
                className="w-full justify-start"
                size="sm"
                onClick={() => {
                  // TODO: Wire to real logout
                  console.log("Logout clicked");
                }}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <header className="flex h-16 items-center justify-between border-b border-zinc-800 bg-zinc-900/40 px-4 lg:px-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold text-foreground">Dashboard</h1>
          </div>

          {/* TODO: Add notifications, settings, etc. */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              🚧 Labs Preview
            </span>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="container px-4 py-6 lg:px-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
