"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Download, AlertCircle, CheckCircle2, User } from "lucide-react";

export default function ProfileExportPage() {
  const [isExporting, setIsExporting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleExport = async () => {
    setIsExporting(true);
    setMessage(null);

    try {
      const response = await fetch("/api/export/user/me", {
        method: "GET",
        headers: {
          "Accept": "application/json",
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to export user data");
      }

      // Get the blob from response
      const blob = await response.blob();

      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `user-data-export-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();

      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setMessage({
        type: "success",
        text: "Your data has been exported successfully! Download should start automatically."
      });
    } catch (error: any) {
      console.error("Failed to export user data:", error);
      setMessage({
        type: "error",
        text: error.message || "Failed to export user data"
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="container px-4 py-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8 flex items-center gap-3">
            <User className="h-10 w-10 text-neon-purple" />
            <div>
              <h1 className="text-4xl font-bold">My Data Export</h1>
              <p className="text-muted-foreground">
                Download a complete copy of your personal data
              </p>
            </div>
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
              <CardTitle>Export My Data</CardTitle>
              <CardDescription>
                Download all personal data associated with your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border bg-muted/50 p-4">
                <h3 className="mb-2 font-semibold">What&apos;s included in your export:</h3>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Your profile information</li>
                  <li>• Guild memberships and roles</li>
                  <li>• Conversations and chat messages</li>
                  <li>• Personal statistics and analytics</li>
                  <li>• Screenshot analyses and comparisons</li>
                  <li>• Club analyses you&apos;ve created</li>
                  <li>• Your activity audit logs</li>
                </ul>
              </div>

              <div className="rounded-lg border border-blue-500/50 bg-blue-500/10 p-4">
                <h3 className="mb-2 flex items-center gap-2 font-semibold text-blue-500">
                  <AlertCircle className="h-4 w-4" />
                  Data Privacy Rights
                </h3>
                <p className="text-sm text-muted-foreground">
                  This export is provided in compliance with data protection regulations
                  like GDPR. You have the right to access, transfer, and manage your
                  personal data. This export contains all data we store about you.
                </p>
              </div>

              <div className="rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-4">
                <h3 className="mb-2 flex items-center gap-2 font-semibold text-yellow-500">
                  <AlertCircle className="h-4 w-4" />
                  Security Notice
                </h3>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Session tokens and passwords are never included</li>
                  <li>• IP addresses and user agents are excluded for privacy</li>
                  <li>• Store your export file securely - it contains personal data</li>
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
                    Download My Data (JSON)
                  </>
                )}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                Export format: JSON v1.0.0 • Limits: 10k messages, 10k stats, 5k audit logs
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>About Your Data Export</CardTitle>
              <CardDescription>Understanding what you&apos;re downloading</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                Your export is provided in JSON format and includes all personal data
                stored in our systems. The export follows a stable schema (v1.0.0) that
                includes metadata about when it was created.
              </p>
              <p>
                You can use this data for:
              </p>
              <ul className="ml-4 list-disc space-y-1">
                <li>Personal backup and archival</li>
                <li>Transferring your data to another service (data portability)</li>
                <li>Verifying what information we store about you</li>
                <li>Compliance with your data protection rights</li>
              </ul>
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
