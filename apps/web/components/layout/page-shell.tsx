"use client";

import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

interface PageShellProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  status?: ReactNode;
  children: ReactNode;
}

/**
 * PageShell - Consistent page layout wrapper
 */
export function PageShell({ icon: Icon, title, subtitle, status, children }: PageShellProps) {
  return (
    <div className="container px-4 py-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div className="flex items-start gap-3">
            <Icon className="h-10 w-10 text-neon-green mt-1" />
            <div>
              <h1 className="mb-1 text-4xl font-bold">{title}</h1>
              {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
            </div>
          </div>
          {status && <div className="mt-2">{status}</div>}
        </div>

        {/* Content */}
        {children}
      </div>
    </div>
  );
}
