/**
 * PageShell Component
 *
 * Shared layout wrapper for application pages.
 * Provides consistent structure with header, title, subtitle, status badge, and actions.
 */

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface PageShellProps {
  /**
   * Icon to display next to the title
   */
  icon?: ReactNode;

  /**
   * Page title
   */
  title: string;

  /**
   * Optional subtitle/description
   */
  subtitle?: string;

  /**
   * Status indicator (typically ConnectionBadge)
   */
  status?: ReactNode;

  /**
   * Primary action button
   */
  primaryAction?: ReactNode;

  /**
   * Secondary actions
   */
  secondaryActions?: ReactNode;

  /**
   * Page content
   */
  children: ReactNode;

  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Shared page layout wrapper
 */
export function PageShell({
  icon,
  title,
  subtitle,
  status,
  primaryAction,
  secondaryActions,
  children,
  className,
}: PageShellProps) {
  return (
    <div className={cn("container px-4 py-8", className)}>
      <div className="mx-auto max-w-6xl">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                {icon && <div className="text-3xl">{icon}</div>}
                <h1 className="text-4xl font-bold">{title}</h1>
              </div>
              {subtitle && (
                <p className="text-muted-foreground text-lg">{subtitle}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {status}
            </div>
          </div>

          {/* Actions */}
          {(primaryAction || secondaryActions) && (
            <div className="mt-4 flex items-center gap-2">
              {primaryAction}
              {secondaryActions}
            </div>
          )}
        </div>

        {/* Page Content */}
        <div>{children}</div>
      </div>
    </div>
  );
}
