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
import { fetchSnailCodes, isUsingSandbox, type SnailCode } from "@/lib/api/snail-codes";

export default function CodesPage() {
  const [codes, setCodes] = useState<SnailCode[]>([]);
  const [filteredCodes, setFilteredCodes] = useState<SnailCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [reportingCode, setReportingCode] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "expired">("active");

  const loadCodes = useCallback(async (hardRefresh = false) => {
    if (hardRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await fetchSnailCodes();
      setCodes(data);
    } catch (error) {
      console.error("Failed to fetch codes:", error);
      // fetchSnailCodes already handles fallback to sandbox
      setCodes([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadCodes();
  }, [loadCodes]);

  // Client-side filtering (search + status)
  useEffect(() => {
    let filtered = codes;

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((code) => code.status === statusFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((code) => {
        return (
          code.code.toLowerCase().includes(query) ||
          code.title?.toLowerCase().includes(query) ||
          code.source.toLowerCase().includes(query) ||
          code.status.toLowerCase().includes(query)
        );
      });
    }

    setFilteredCodes(filtered);
  }, [searchQuery, codes, statusFilter]);

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

  const getSourceBadge = (source: SnailCode["source"]) => {
    switch (source) {
      case "snelp":
        return <Badge variant="default">Snelp</Badge>;
      case "reddit":
        return <Badge variant="secondary">Reddit</Badge>;
      case "twitter":
        return <Badge variant="outline">Twitter</Badge>;
      case "discord":
        return <Badge variant="outline">Discord</Badge>;
      case "other":
        return <Badge variant="outline">Other</Badge>;
    }
  };

  const getStatusBadge = (status: SnailCode["status"]) => {
    switch (status) {
      case "active":
        return <Badge variant="default">Active</Badge>;
      case "expired":
        return <Badge variant="destructive">Expired</Badge>;
      case "unknown":
        return <Badge variant="secondary">Unknown</Badge>;
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
              variant={statusFilter === "active" ? "neon" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("active")}
            >
              Active
            </Button>
            <Button
              variant={statusFilter === "expired" ? "neon" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("expired")}
            >
              Expired
            </Button>
            <Button
              variant={statusFilter === "all" ? "neon" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("all")}
            >
              All
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadCodes(true)}
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
                  <Card key={`${code.id}-${index}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="font-mono text-lg">
                            {code.code}
                          </CardTitle>
                          <CardDescription>
                            {code.foundAt && `Added ${new Date(code.foundAt).toLocaleDateString()}`}
                            {code.title && ` • ${code.title}`}
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          {getSourceBadge(code.source)}
                          {getStatusBadge(code.status)}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap gap-2">
                          {code.expiresAt && (
                            <Badge variant={code.status === "expired" ? "destructive" : "outline"}>
                              {code.status === "expired" ? "Expired" : "Expires"} {new Date(code.expiresAt).toLocaleDateString()}
                            </Badge>
                          )}
                          {!code.expiresAt && code.status === "active" && (
                            <Badge variant="outline">No Expiry</Badge>
                          )}
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
