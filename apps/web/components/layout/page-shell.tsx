import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

export interface PageShellProps {
  icon?: LucideIcon;
  title: string;
  subtitle?: string;
  status?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}

/**
 * PageShell - Consistent layout for feature pages
 *
 * Provides a unified structure with optional icon, title, subtitle, status badge, and action buttons.
 */
export function PageShell({
  icon: Icon,
  title,
  subtitle,
  status,
  actions,
  children,
}: PageShellProps) {
  return (
    <div className="container px-4 py-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-3">
              {Icon && <Icon className="h-10 w-10 text-neon-green" />}
              <h1 className="text-4xl font-bold">{title}</h1>
            </div>
            {subtitle && (
              <p className="text-muted-foreground">{subtitle}</p>
            )}
            {status && (
              <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                {status}
              </div>
            )}
          </div>
          {actions && (
            <div className="flex items-center gap-2">
              {actions}
            </div>
          )}
        </div>

        {/* Content */}
        {children}
      </div>
    </div>
  );
}
