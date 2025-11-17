import { Circle } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatusPillProps {
  online: boolean;
  className?: string;
}

export function StatusPill({ online, className }: StatusPillProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium",
        online
          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
          : "bg-red-500/20 text-red-400 border border-red-500/30",
        className
      )}
    >
      <Circle
        className={cn(
          "h-2.5 w-2.5 fill-current",
          online ? "text-emerald-400" : "text-red-400"
        )}
      />
      <span>{online ? "Online" : "Offline"}</span>
    </div>
  );
}
