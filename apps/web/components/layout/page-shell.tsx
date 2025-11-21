/**
 * PageShell - Shared layout component for internal pages
 *
 * Provides consistent structure with:
 * - Header section with title, description, and status indicator
 * - Content wrapper with max-width and padding
 */

import { ReactNode } from 'react';

interface PageShellProps {
  /** Page title */
  title: string;
  /** Page description */
  description?: string;
  /** Status indicator node (e.g., connection status) */
  status?: ReactNode;
  /** Page content */
  children: ReactNode;
  /** Additional CSS classes for the container */
  className?: string;
}

export function PageShell({
  title,
  description,
  status,
  children,
  className = '',
}: PageShellProps) {
  return (
    <div className={`container px-4 py-16 ${className}`}>
      <div className="mx-auto max-w-6xl">
        {/* Header section */}
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <h1 className="mb-2 text-4xl font-bold">{title}</h1>
              {description && (
                <p className="text-muted-foreground">{description}</p>
              )}
            </div>
            {status && (
              <div className="flex items-center gap-2 text-sm">
                {status}
              </div>
            )}
          </div>
        </div>

        {/* Content section */}
        <div className="space-y-6">
          {children}
        </div>
      </div>
    </div>
  );
}
