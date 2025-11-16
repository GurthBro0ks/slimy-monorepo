"use client";

import React, { useEffect, useState } from "react";
import { Badge } from "./ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { UsageData, UsageLevel } from "@/lib/usage-thresholds";

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
        const response = await fetch("/api/usage");
        if (response.ok) {
          const data = await response.json();
          setUsage(data.data);
        }
      } catch (error) {
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
      <Badge variant="secondary" className="cursor-pointer">
        <span className="md:hidden">•</span>
        <span className="hidden md:inline">Loading...</span>
      </Badge>
    );
  }

  const percentage = Math.round((usage.currentSpend / usage.limit) * 100);

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
          <Badge variant={levelColors[usage.level]} className="cursor-pointer">
            <span className="mr-1">{statusIcons[usage.modelProbeStatus]}</span>
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
