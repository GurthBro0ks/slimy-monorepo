import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}

export function Section({ title, subtitle, children, className }: SectionProps) {
  return (
    <section className={cn("mb-12", className)}>
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-neon-green mb-2">{title}</h2>
        {subtitle && (
          <p className="text-muted-foreground text-lg">{subtitle}</p>
        )}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}
