"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CopyBox } from "@/components/ui/copy-box";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Callout } from "@/components/ui/callout";
import { RefreshCw, Search, Flag } from "lucide-react";
import { ProtectedRoute } from "@/components/auth/protected-route";

interface Code {
  code: string;
  source: "snelp" | "reddit";
  ts: string;
  tags: string[];
  expires: string | null;
  region: string;
  description?: string;
}

export default function CodesPage() {
  const [codes, setCodes] = useState<Code[]>([]);
  const [filteredCodes, setFilteredCodes] = useState<Code[]>([]);
  const [loading, setLoading] = useState(true);
  const [scope, setScope] = useState<"active" | "past7" | "all">("active");
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [reportingCode, setReportingCode] = useState<string | null>(null);

  const fetchCodes = useCallback(async (hardRefresh = false) => {
    if (hardRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const cache = hardRefresh ? "no-cache" : "default";
      const response = await fetch(`/api/codes?scope=${scope}`, { cache });

      if (response.ok) {
        const data = await response.json();
        setCodes(data.codes || []);
      }
    } catch (error) {
      console.error("Failed to fetch codes:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [scope]);

  useEffect(() => {
    fetchCodes();
  }, [fetchCodes]);

  // Client-side search filtering
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredCodes(codes);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = codes.filter((code) => {
      return (
        code.code.toLowerCase().includes(query) ||
        code.description?.toLowerCase().includes(query) ||
        code.tags.some((tag) => tag.toLowerCase().includes(query)) ||
        code.source.toLowerCase().includes(query)
      );
    });

    setFilteredCodes(filtered);
  }, [searchQuery, codes]);

  const handleReportCode = async (code: string) => {
    setReportingCode(code);

    try {
      const response = await fetch("/api/codes/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          reason: "dead",
          guildId: "web",
          userId: "anonymous",
        }),
      });

      if (response.ok) {
        console.info("Code reported:", code);
        // Show success feedback
        setTimeout(() => setReportingCode(null), 1000);
      }
    } catch (error) {
      console.error("Failed to report code:", error);
      setReportingCode(null);
    }
  };

  const allCodesText = filteredCodes.map((c) => c.code).join("\n");

  const getSourceBadge = (source: Code["source"]) => {
    switch (source) {
      case "snelp":
        return <Badge variant="default">Snelp</Badge>;
      case "reddit":
        return <Badge variant="secondary">Reddit</Badge>;
    }
  };

  return (
    <ProtectedRoute>
      <div className="container px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="mb-2 text-4xl font-bold">Secret Codes</h1>
          <p className="text-muted-foreground">
            Aggregated from Snelp and Reddit r/SuperSnailGame
          </p>
        </div>

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2">
            <Button
              variant={scope === "active" ? "neon" : "outline"}
              size="sm"
              onClick={() => setScope("active")}
            >
              Active
            </Button>
            <Button
              variant={scope === "past7" ? "neon" : "outline"}
              size="sm"
              onClick={() => setScope("past7")}
            >
              Past 7 Days
            </Button>
            <Button
              variant={scope === "all" ? "neon" : "outline"}
              size="sm"
              onClick={() => setScope("all")}
            >
              All
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchCodes(true)}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            <span className="ml-2">Refresh</span>
          </Button>
        </div>

        {/* Search Box */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search codes, descriptions, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border bg-background px-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neon-green"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : (
          <>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Copy All Codes</CardTitle>
                <CardDescription>
                  {filteredCodes.length} code{filteredCodes.length !== 1 ? "s" : ""} available
                  {searchQuery && ` (filtered from ${codes.length})`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CopyBox content={allCodesText} label="Copy All" />
              </CardContent>
            </Card>

            {filteredCodes.length === 0 ? (
              <Callout variant="warn">
                No codes found matching &quot;{searchQuery}&quot;
              </Callout>
            ) : (
              <div className="space-y-4">
                {filteredCodes.map((code, index) => (
                  <Card key={`${code.code}-${index}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="font-mono text-lg">
                            {code.code}
                          </CardTitle>
                          <CardDescription>
                            Added {new Date(code.ts).toLocaleDateString()}
                            {code.description && ` • ${code.description}`}
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          {getSourceBadge(code.source)}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap gap-2">
                          {code.region && (
                            <Badge variant="outline">{code.region.toUpperCase()}</Badge>
                          )}
                          {code.expires && (
                            <Badge variant="destructive">
                              Expires {new Date(code.expires).toLocaleDateString()}
                            </Badge>
                          )}
                          {code.tags?.map((tag) => (
                            <Badge key={tag} variant="secondary">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleReportCode(code.code)}
                          disabled={reportingCode === code.code}
                          className="text-xs"
                        >
                          <Flag className="h-3 w-3 mr-1" />
                          {reportingCode === code.code ? "Reported" : "Report Dead"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
      </div>
    </ProtectedRoute>
  );
}
