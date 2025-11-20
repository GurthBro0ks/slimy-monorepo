import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Reusable card skeleton component matching the app's design system
 */
export const CardSkeleton = ({
  className,
  height = "h-32"
}: {
  className?: string;
  height?: string;
}) => (
  <div className={cn(
    "rounded-2xl border border-emerald-500/30 bg-zinc-900/40 p-6",
    height,
    className
  )}>
    <Skeleton className="h-6 w-32 mb-3" />
    <Skeleton className="h-4 w-full mb-2" />
    <Skeleton className="h-4 w-3/4" />
  </div>
);

/**
 * Skeleton for a list of cards
 */
export const CardListSkeleton = ({
  count = 3,
  className
}: {
  count?: number;
  className?: string;
}) => (
  <div className={cn("space-y-4", className)}>
    {Array.from({ length: count }).map((_, i) => (
      <Skeleton key={i} className="h-32 w-full rounded-2xl" />
    ))}
  </div>
);

/**
 * Skeleton for a grid of cards
 */
export const CardGridSkeleton = ({
  count = 3,
  className
}: {
  count?: number;
  className?: string;
}) => (
  <div className={cn("grid gap-6 lg:grid-cols-3", className)}>
    {Array.from({ length: count }).map((_, i) => (
      <Skeleton key={i} className="h-64 w-full rounded-2xl" />
    ))}
  </div>
);
