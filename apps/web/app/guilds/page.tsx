"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Callout } from "@/components/ui/callout";
import { Shield } from "lucide-react";
import { ProtectedRoute } from "@/components/auth/protected-route";

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

          <Callout variant="info" className="mb-8">
            Connect Admin API to view and manage guilds. This page requires admin role.
          </Callout>

          <Card>
            <CardHeader>
              <CardTitle>Guild Management</CardTitle>
              <CardDescription>
                View and configure bot settings for all connected guilds
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Guild list will appear here once Admin API is connected.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}
