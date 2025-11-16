"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { FileText } from "lucide-react";

const docLinks = [
  { href: "/docs/getting-started", label: "Getting Started" },
  { href: "/docs/snail-tools", label: "Snail Tools" },
  { href: "/docs/club-analytics", label: "Club Analytics" },
];

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="container px-4 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className="w-64 shrink-0">
            <div className="sticky top-20">
              <h2 className="mb-4 text-lg font-semibold">Documentation</h2>
              <nav className="space-y-1">
                {docLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                      pathname === link.href
                        ? "bg-neon-green/10 text-neon-green font-medium"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <FileText className="h-4 w-4" />
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>
          </aside>

          {/* Content */}
          <main className="flex-1 min-w-0">
            <article className="prose prose-invert max-w-none">{children}</article>
          </main>
        </div>
      </div>
    </div>
  );
}
