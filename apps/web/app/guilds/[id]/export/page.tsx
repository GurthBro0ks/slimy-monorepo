"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Download, AlertCircle, CheckCircle2 } from "lucide-react";

export default function GuildExportPage() {
  const params = useParams();
  const guildId = params.id as string;

  const [isExporting, setIsExporting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleExport = async () => {
    setIsExporting(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/export/guild/${guildId}`, {
        method: "GET",
        headers: {
          "Accept": "application/json",
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to export guild data");
      }

      // Get the blob from response
      const blob = await response.blob();

      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `guild-${guildId}-export-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();

      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setMessage({
        type: "success",
        text: "Guild data exported successfully! Download should start automatically."
      });
    } catch (error: any) {
      console.error("Failed to export guild data:", error);
      setMessage({
        type: "error",
        text: error.message || "Failed to export guild data"
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <ProtectedRoute requiredRole="viewer">
      <div className="container px-4 py-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8">
            <h1 className="mb-2 text-4xl font-bold">Guild Data Export</h1>
            <p className="text-muted-foreground">
              Download a complete backup of your guild data in JSON format
            </p>
          </div>

          {message && (
            <Callout
              variant={message.type === "success" ? "success" : "error"}
              className="mb-6"
            >
              <div className="flex items-center gap-2">
                {message.type === "success" ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                {message.text}
              </div>
            </Callout>
          )}

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Export Guild Data</CardTitle>
              <CardDescription>
                Download all data associated with this guild
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border bg-muted/50 p-4">
                <h3 className="mb-2 font-semibold">What&apos;s included in the export:</h3>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Guild information and settings</li>
                  <li>• Member list and roles</li>
                  <li>• Statistics and analytics</li>
                  <li>• Chat messages (up to 10,000 most recent)</li>
                  <li>• Club analyses and metrics</li>
                  <li>• Audit logs (up to 5,000 most recent)</li>
                </ul>
              </div>

              <div className="rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-4">
                <h3 className="mb-2 flex items-center gap-2 font-semibold text-yellow-500">
                  <AlertCircle className="h-4 w-4" />
                  Privacy & Security
                </h3>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• IP addresses and user agents are excluded for privacy</li>
                  <li>• Session tokens and passwords are never included</li>
                  <li>• This export is for backup and compliance purposes</li>
                </ul>
              </div>

              <Button
                onClick={handleExport}
                disabled={isExporting}
                className="w-full"
                size="lg"
              >
                {isExporting ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Download Guild Export (JSON)
                  </>
                )}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                Export format: JSON v1.0.0 • Guild ID: {guildId}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>About the Export Format</CardTitle>
              <CardDescription>Understanding your export data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                The export is provided in JSON format and follows a stable schema (v1.0.0).
                Each export includes metadata about when it was created and what version
                of the export format was used.
              </p>
              <p>
                You can use this data for backup purposes, data portability, or compliance
                with data protection regulations. The JSON format makes it easy to process
                and analyze your data programmatically.
              </p>
              <p className="text-xs">
                For technical documentation about the export format, see EXPORT_FORMAT.md
                in the repository.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}
