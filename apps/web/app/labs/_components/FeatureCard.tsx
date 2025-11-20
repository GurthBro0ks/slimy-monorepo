import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface FeatureCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  href?: string;
  iconColor?: string;
  disabled?: boolean;
}

export function FeatureCard({
  title,
  description,
  icon: Icon,
  href,
  iconColor = "text-neon-green",
  disabled = false,
}: FeatureCardProps) {
  const Wrapper = href && !disabled ? "a" : "div";

  return (
    <Wrapper
      {...(href && !disabled ? { href } : {})}
      className={cn(
        "group relative overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/40 p-6 transition-all",
        !disabled && "hover:border-emerald-500/30 hover:bg-zinc-900/60",
        disabled && "opacity-50 cursor-not-allowed",
        href && !disabled && "cursor-pointer"
      )}
    >
      <div className="flex items-start gap-4">
        <div
          className={cn(
            "rounded-lg bg-zinc-800/50 p-3",
            !disabled && "group-hover:bg-zinc-800/80"
          )}
        >
          <Icon className={cn("h-6 w-6", iconColor)} />
        </div>
        <div className="flex-1">
          <h3 className="mb-2 text-lg font-semibold text-foreground">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    </Wrapper>
  );
}
