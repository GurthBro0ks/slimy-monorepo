"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Upload, CheckCircle, XCircle, ImageIcon } from "lucide-react";
import { ProtectedRoute } from "@/components/auth/protected-route";

interface UploadResult {
  ok: boolean;
  screenshot?: {
    id: number;
    guildId: string;
    uploaderUserId?: string;
    originalFilename: string;
    storagePath: string;
    createdAt: string;
  };
  analysis?: {
    id: number | null;
    summary: string;
    model: string | null;
    saved: boolean;
  };
  error?: string;
  message?: string;
}

export default function ScreenshotUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [guildId, setGuildId] = useState("");
  const [uploaderUserId, setUploaderUserId] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setUploadResult(null);

      // Create preview URL
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      setUploadResult({
        ok: false,
        error: "No file selected",
        message: "Please select an image file to upload",
      });
      return;
    }

    if (!guildId) {
      setUploadResult({
        ok: false,
        error: "Missing guild ID",
        message: "Please enter a guild ID",
      });
      return;
    }

    setIsUploading(true);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("guildId", guildId);
      if (uploaderUserId) {
        formData.append("uploaderUserId", uploaderUserId);
      }
      formData.append("autoAnalyze", "true");

      const response = await fetch("/api/club/screenshot-upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setUploadResult({
          ok: false,
          error: data.error || "upload_failed",
          message: data.message || "Failed to upload screenshot",
        });
      } else {
        setUploadResult(data);
        // Clear form on success
        setFile(null);
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
        }
        setPreviewUrl(null);
      }
    } catch (error) {
      console.error("Upload error:", error);
      setUploadResult({
        ok: false,
        error: "network_error",
        message: error instanceof Error ? error.message : "Network error occurred",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-6 w-6" />
              Club Screenshot Upload
            </CardTitle>
            <CardDescription>
              Upload club screenshots for AI-powered analysis using GPT-4 Vision
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* File Input */}
              <div className="space-y-2">
                <Label htmlFor="file">Screenshot Image</Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="file"
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                    onChange={handleFileChange}
                    disabled={isUploading}
                    className="cursor-pointer"
                  />
                  {file && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <ImageIcon className="h-4 w-4" />
                      {file.name}
                    </div>
                  )}
                </div>
                {previewUrl && (
                  <div className="mt-2 border rounded-lg p-2">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="max-w-full h-auto max-h-64 object-contain mx-auto"
                    />
                  </div>
                )}
              </div>

              {/* Guild ID */}
              <div className="space-y-2">
                <Label htmlFor="guildId">Guild ID *</Label>
                <Input
                  id="guildId"
                  type="text"
                  placeholder="Enter guild/server ID"
                  value={guildId}
                  onChange={(e) => setGuildId(e.target.value)}
                  disabled={isUploading}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  The Discord server/guild ID associated with this screenshot
                </p>
              </div>

              {/* Uploader User ID (Optional) */}
              <div className="space-y-2">
                <Label htmlFor="uploaderUserId">Uploader User ID (Optional)</Label>
                <Input
                  id="uploaderUserId"
                  type="text"
                  placeholder="Enter user ID (optional)"
                  value={uploaderUserId}
                  onChange={(e) => setUploaderUserId(e.target.value)}
                  disabled={isUploading}
                />
                <p className="text-xs text-muted-foreground">
                  The user who uploaded this screenshot (optional)
                </p>
              </div>

              {/* Submit Button */}
              <Button type="submit" disabled={isUploading || !file || !guildId} className="w-full">
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading & Analyzing...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Screenshot
                  </>
                )}
              </Button>
            </form>

            {/* Results */}
            {uploadResult && (
              <div className="space-y-4 pt-4 border-t">
                {uploadResult.ok ? (
                  <>
                    <Alert className="border-green-500 bg-green-50">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800">
                        Screenshot uploaded successfully!
                      </AlertDescription>
                    </Alert>

                    {uploadResult.screenshot && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">Screenshot Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                          <div className="grid grid-cols-2 gap-2">
                            <span className="font-medium">ID:</span>
                            <span>{uploadResult.screenshot.id}</span>

                            <span className="font-medium">Filename:</span>
                            <span className="truncate">{uploadResult.screenshot.originalFilename}</span>

                            <span className="font-medium">Guild ID:</span>
                            <span className="truncate">{uploadResult.screenshot.guildId}</span>

                            <span className="font-medium">Uploaded:</span>
                            <span>{new Date(uploadResult.screenshot.createdAt).toLocaleString()}</span>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {uploadResult.analysis && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">AI Analysis Result</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {uploadResult.analysis.model && (
                            <div className="text-xs text-muted-foreground">
                              Model: {uploadResult.analysis.model}
                            </div>
                          )}
                          <div className="p-3 bg-muted rounded-md">
                            <p className="text-sm">{uploadResult.analysis.summary}</p>
                          </div>
                          {uploadResult.analysis.saved && (
                            <div className="text-xs text-muted-foreground">
                              Analysis ID: {uploadResult.analysis.id}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}
                  </>
                ) : (
                  <Alert className="border-red-500 bg-red-50">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                      <div className="font-medium">{uploadResult.error}</div>
                      {uploadResult.message && (
                        <div className="text-sm mt-1">{uploadResult.message}</div>
                      )}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {/* Info Section */}
            <div className="pt-4 border-t">
              <h3 className="text-sm font-medium mb-2">About Vision Analysis</h3>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>
                  This feature uploads screenshots and optionally analyzes them using GPT-4 Vision.
                </p>
                <p>
                  If vision analysis is not configured (VISION_ENABLED=false or missing API key),
                  screenshots will still be stored but analysis will return a stubbed response.
                </p>
                <p className="text-yellow-600 font-medium">
                  Configure OPENAI_API_KEY and VISION_ENABLED=true in .env to enable real AI analysis.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
