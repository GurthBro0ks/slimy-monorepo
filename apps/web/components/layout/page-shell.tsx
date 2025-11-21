import React from "react";

type PageShellProps = {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  primaryAction?: React.ReactNode;
  secondaryAction?: React.ReactNode;
  children: React.ReactNode;
  status?: React.ReactNode;
  sidebar?: React.ReactNode;
};

export function PageShell({
  icon,
  title,
  subtitle,
  primaryAction,
  secondaryAction,
  children,
  status,
  sidebar,
}: PageShellProps) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-20">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {icon && <div className="text-xl">{icon}</div>}
            <div>
              <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
              {subtitle && (
                <p className="text-xs text-slate-400">{subtitle}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {secondaryAction}
            {primaryAction}
          </div>
        </div>
        {status && (
          <div className="mx-auto max-w-6xl px-4 pb-3">
            <div className="text-xs text-slate-400 flex items-center gap-2">
              {status}
            </div>
          </div>
        )}
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 flex flex-col lg:flex-row gap-6">
        <section className="flex-1 flex flex-col gap-4">{children}</section>
        {sidebar && (
          <aside className="w-full lg:w-72 flex-shrink-0">
            {sidebar}
          </aside>
        )}
      </main>
    </div>
  );
}
