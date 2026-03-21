"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Callout } from "@/components/ui/callout";
import { Shield } from "lucide-react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { GuildList } from "@/components/dashboard/guild-list";

export default function GuildsPage() {
  return (
    <ProtectedRoute requiredRole="admin">
      <div className="container px-4 py-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex items-center gap-3">
            <Shield className="h-10 w-10 text-neon-purple" />
            <div>
              <h1 className="text-4xl font-bold">Admin Panel</h1>
              <p className="text-muted-foreground">
                Manage guilds and bot configuration
              </p>
            </div>
          </div>

          <div className="mb-8">
            <GuildList />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
