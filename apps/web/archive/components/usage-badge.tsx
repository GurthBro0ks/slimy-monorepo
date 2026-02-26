"use client";

import React, { useEffect, useState } from "react";
import { Badge } from "./ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { UsageData, UsageLevel } from "@/lib/usage-thresholds";
import { fetchUsageDataSafe } from "@/lib/api/usage";

const levelColors: Record<UsageLevel, "default" | "secondary" | "destructive"> = {
  free: "secondary",
  pro: "default",
  over_cap: "destructive",
};

const levelText: Record<UsageLevel, string> = {
  free: "Free Tier",
  pro: "Pro Tier",
  over_cap: "Usage Cap Reached",
};

const statusIcons: Record<UsageData["modelProbeStatus"], React.ReactElement> = {
  ok: <CheckCircle className="h-3 w-3 text-neon-green" />,
  soft_cap: <AlertTriangle className="h-3 w-3 text-yellow-500" />,
  hard_cap: <XCircle className="h-3 w-3 text-red-500" />,
};

export function UsageBadge() {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUsage() {
      try {
        const data = await fetchUsageDataSafe();
        setUsage(data);
      } catch (error) {
        // Error already logged by fetchUsageDataSafe
        console.error("Failed to fetch usage:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchUsage();
    // Refresh every 30 seconds
    const interval = setInterval(fetchUsage, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading || !usage) {
    return (
      <Badge
        variant="secondary"
        className="cursor-pointer"
        data-testid="usage-badge"
        data-usage-level="loading"
      >
        <span className="md:hidden">•</span>
        <span className="hidden md:inline">Loading...</span>
      </Badge>
    );
  }

  // Calculate percentage safely, avoiding division by zero and clamping to 0-100
  const percentage = usage.limit > 0
    ? Math.min(100, Math.max(0, Math.round((usage.currentSpend / usage.limit) * 100)))
    : 0;

  const tooltipContent = (
    <div className="space-y-1 text-xs">
      <p className="font-bold">{levelText[usage.level]}</p>
      <p>
        Spend: ${usage.currentSpend} / ${usage.limit} ({percentage}%)
      </p>
      <p className="flex items-center gap-1">
        Model Probe Status: {statusIcons[usage.modelProbeStatus]}
        <span className="capitalize">
          {usage.modelProbeStatus.replace("_", " ")}
        </span>
      </p>
      {usage.modelProbeStatus === "hard_cap" && (
        <p className="text-red-400">
          Probe actions are disabled until next billing cycle.
        </p>
      )}
    </div>
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant={levelColors[usage.level]}
            className="cursor-pointer"
            data-testid="usage-badge"
            data-usage-level={usage.level}
            data-usage-status={usage.modelProbeStatus}
          >
            <span className="mr-1" data-testid={`usage-status-icon-${usage.modelProbeStatus}`}>
              {statusIcons[usage.modelProbeStatus]}
            </span>
            <span className="hidden md:inline">Usage: {percentage}%</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="bg-card border-border text-foreground">
          {tooltipContent}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
