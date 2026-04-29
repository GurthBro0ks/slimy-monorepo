"use client";

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
        </div>
      </div>
    </ProtectedRoute>
  );
}
