"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FeatureCard } from "../_components/FeatureCard";
import { RoleIndicator } from "../_components/RoleIndicator";
import {
  Wrench,
  MessageSquare,
  Pickaxe,
  Shield,
  TrendingUp,
  Users,
  Activity,
  ArrowRight,
} from "lucide-react";

export default function DashboardPage() {
  // TODO: Replace with real user from auth context/session
  // This should come from something like useAuth() or getServerSession()
  const mockUser = {
    id: "mock-user-123",
    name: "Demo User",
    email: "demo@example.com",
    avatar: null,
    role: "admin" as const, // Try changing to 'club' or 'user' to test different views
    isAdmin: true, // TODO: Wire to real permissions system
    isClubMember: true, // TODO: Wire to real club membership check
    createdAt: "2024-01-15",
  };

  // TODO: Replace with real API calls
  const mockStats = {
    totalCommands: 1234,
    chatMessages: 5678,
    minecraftPlayers: 42,
    serverUptime: "99.8%",
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="mb-2 text-2xl font-bold text-foreground">
            Welcome back, {mockUser.name}!
          </h2>
          <div className="flex items-center gap-2">
            <p className="text-muted-foreground">
              Here's what's happening with your services
            </p>
            <RoleIndicator role={mockUser.role} />
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-zinc-800 bg-zinc-900/40">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Commands
            </CardTitle>
            <Activity className="h-4 w-4 text-neon-green" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {mockStats.totalCommands.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              +20% from last month
            </p>
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900/40">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Chat Messages
            </CardTitle>
            <MessageSquare className="h-4 w-4 text-purple" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {mockStats.chatMessages.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900/40">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              MC Players
            </CardTitle>
            <Users className="h-4 w-4 text-lime-green" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {mockStats.minecraftPlayers}
            </div>
            <p className="text-xs text-muted-foreground">Currently online</p>
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900/40">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Uptime
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {mockStats.serverUptime}
            </div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions Section */}
      <div>
        <h3 className="mb-4 text-lg font-semibold text-foreground">
          Quick Access
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Snail Tools - Available to all users */}
          <FeatureCard
            title="Snail Tools"
            description="Manage your Discord bot and utilities"
            icon={Wrench}
            iconColor="text-neon-green"
            href="/labs/dashboard/snail"
          />

          {/* Slime Chat - Available to all users */}
          <FeatureCard
            title="Slime Chat"
            description="Configure AI chat settings"
            icon={MessageSquare}
            iconColor="text-purple"
            href="/labs/dashboard/chat"
          />

          {/* slime.craft - Available to all users */}
          <FeatureCard
            title="slime.craft"
            description="View Minecraft stats and manage server"
            icon={Pickaxe}
            iconColor="text-lime-green"
            href="/labs/dashboard/minecraft"
          />

          {/* Admin - Only shown to admins */}
          {mockUser.isAdmin && (
            <FeatureCard
              title="Admin"
              description="Advanced controls and analytics"
              icon={Shield}
              iconColor="text-dark-purple"
              href="/labs/dashboard/admin"
            />
          )}
        </div>
      </div>

      {/* Role-Specific Sections */}
      {mockUser.isClubMember && (
        <Card className="border-emerald-500/30 bg-zinc-900/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <span className="text-neon-green">✨</span>
              Club Member Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">
              Exclusive features available to Slimy Club members
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Button variant="outline" className="justify-start">
                Priority Support
                <ArrowRight className="ml-auto h-4 w-4" />
              </Button>
              <Button variant="outline" className="justify-start">
                Advanced Analytics
                <ArrowRight className="ml-auto h-4 w-4" />
              </Button>
              <Button variant="outline" className="justify-start">
                Custom Integrations
                <ArrowRight className="ml-auto h-4 w-4" />
              </Button>
              <Button variant="outline" className="justify-start">
                Beta Features
                <ArrowRight className="ml-auto h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {mockUser.isAdmin && (
        <Card className="border-purple/30 bg-zinc-900/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Shield className="h-5 w-5 text-dark-purple" />
              Admin Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">
              Administrative controls and system overview
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              <Button variant="outline" className="justify-start">
                User Management
                <ArrowRight className="ml-auto h-4 w-4" />
              </Button>
              <Button variant="outline" className="justify-start">
                System Logs
                <ArrowRight className="ml-auto h-4 w-4" />
              </Button>
              <Button variant="outline" className="justify-start">
                Configuration
                <ArrowRight className="ml-auto h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Debug Info (TODO: Remove in production) */}
      <Card className="border-yellow-500/30 bg-yellow-900/10">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-yellow-500">
            🚧 Development Debug Info
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground">
          <p className="mb-2">
            <strong>Mock User:</strong> {JSON.stringify(mockUser, null, 2)}
          </p>
          <p className="mt-2 text-yellow-500/80">
            TODO: Replace mockUser with real auth context
          </p>
          <p className="text-yellow-500/80">
            TODO: Replace mockStats with real API calls
          </p>
          <p className="text-yellow-500/80">
            TODO: Wire up feature card hrefs to actual functionality
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
