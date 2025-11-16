"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Callout } from "@/components/ui/callout";
import { Upload, BarChart3, Users, FileSpreadsheet, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { LazyClubResults } from "@/components/lazy";
import type { StoredClubAnalysis } from "@/lib/club/database";

export default function ClubPage() {
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [analyses, setAnalyses] = useState<StoredClubAnalysis[]>([]);
  const [isLoadingResults, setIsLoadingResults] = useState(false);

  // Mock guild and user IDs - in real app these would come from auth context
  const guildId = 'guild-123';
  const userId = 'user-456';

  // Load existing analyses on mount
  useEffect(() => {
    loadAnalyses();
  }, []);

  const loadAnalyses = async () => {
    setIsLoadingResults(true);
    try {
      const response = await fetch(`/api/club/analyze?guildId=${guildId}`);
      if (response.ok) {
        const data = await response.json();
        setAnalyses(data.results || []);
      }
    } catch (error) {
      console.error('Failed to load analyses:', error);
    } finally {
      setIsLoadingResults(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setIsAnalyzing(true);

    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append('screenshots', file);
      });

      // Add required parameters
      formData.append('guildId', guildId);
      formData.append('analyze', 'true'); // Trigger analysis after upload

      const response = await fetch('/api/club/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();

      if (result.success) {
        const newFiles = Array.from(files).map(f => f.name);
        setUploadedFiles(prev => [...prev, ...newFiles]);

        // If analysis results are included, add them to the list
        if (result.analysisResults && result.analysisResults.length > 0) {
          setAnalyses(prev => [...result.analysisResults, ...prev]);
        } else {
          // Reload analyses to get the new ones
          await loadAnalyses();
        }
      }
    } catch (error) {
      console.error('Error uploading files:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
      setIsAnalyzing(false);
    }
  };

  const handleExportToSheets = async () => {
    try {
      const response = await fetch('/api/club/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guildId,
          includeAnalysis: true
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.spreadsheetUrl) {
          window.open(result.spreadsheetUrl, '_blank');
        }
        alert(result.message || 'Export completed successfully!');
      } else {
        alert('Export failed. Please try again.');
      }
    } catch (error) {
      console.error('Error exporting to sheets:', error);
      alert('Export failed. Please try again.');
    }
  };

  const handleExportAnalysis = async (analysisId: string) => {
    try {
      const response = await fetch('/api/club/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guildId,
          analysisId,
          includeAnalysis: true
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.spreadsheetUrl) {
          window.open(result.spreadsheetUrl, '_blank');
        }
      } else {
        alert('Export failed. Please try again.');
      }
    } catch (error) {
      console.error('Error exporting analysis:', error);
      alert('Export failed. Please try again.');
    }
  };

  return (
    <ProtectedRoute requiredRole="club">
      <div className="container px-4 py-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8">
            <h1 className="mb-2 text-4xl font-bold">Club Analytics</h1>
            <p className="text-muted-foreground">
              AI-powered club performance tracking and member statistics
            </p>
          </div>

          <Callout variant="note" className="mb-6 text-sm">
            GPT-4 Vision integration active. Upload screenshots for instant AI analysis.
          </Callout>

          {/* Export Button */}
          <div className="mb-6">
            <Button
              onClick={handleExportToSheets}
              className="bg-emerald-500 hover:bg-emerald-600 text-white"
              disabled={analyses.length === 0}
            >
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Export All to Google Sheets
              {analyses.length > 0 && ` (${analyses.length} analyses)`}
            </Button>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Upload Screenshots Card */}
            <Card className="rounded-2xl border border-emerald-500/30 bg-zinc-900/40 shadow-sm hover:bg-zinc-900/60 transition-colors">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Upload className="h-10 w-10 text-neon-green mb-2" />
                  {isAnalyzing && <Loader2 className="h-5 w-5 animate-spin text-emerald-500" />}
                  {isUploading && !isAnalyzing && <CheckCircle className="h-5 w-5 text-emerald-500" />}
                </div>
                <CardTitle>Upload & Analyze</CardTitle>
                <CardDescription>
                  Upload club screenshots for AI-powered analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <label className="block">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleFileUpload}
                      disabled={isUploading || isAnalyzing}
                      className="block w-full text-sm text-gray-400
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-lg file:border-0
                        file:text-sm file:font-semibold
                        file:bg-emerald-500 file:text-white
                        hover:file:bg-emerald-600
                        file:cursor-pointer cursor-pointer
                        disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </label>

                  {(isUploading || isAnalyzing) && (
                    <div className="text-sm">
                      {isUploading && <p className="text-emerald-500">📤 Uploading files...</p>}
                      {isAnalyzing && <p className="text-blue-500">🤖 Analyzing with AI...</p>}
                    </div>
                  )}

                  {uploadedFiles.length > 0 && (
                    <div className="text-sm text-muted-foreground">
                      <p className="font-semibold mb-1">Recent uploads:</p>
                      <ul className="list-disc list-inside space-y-1 max-h-20 overflow-y-auto">
                        {uploadedFiles.slice(-5).map((file, index) => (
                          <li key={index} className="truncate">{file}</li>
                        ))}
                      </ul>
                      {uploadedFiles.length > 5 && (
                        <p className="text-xs mt-1">...and {uploadedFiles.length - 5} more</p>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Analytics Overview Card */}
            <Card className="rounded-2xl border border-emerald-500/30 bg-zinc-900/40 shadow-sm">
              <CardHeader>
                <BarChart3 className="h-10 w-10 text-neon-green mb-2" />
                <CardTitle>Analytics Overview</CardTitle>
                <CardDescription>
                  AI-powered insights and performance metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Analyses:</span>
                    <span className="font-semibold text-neon-green">{analyses.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Avg Confidence:</span>
                    <span className="font-semibold text-neon-green">
                      {analyses.length > 0
                        ? `${Math.round(analyses.reduce((sum, a) => sum + a.confidence, 0) / analyses.length * 100)}%`
                        : 'N/A'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Latest:</span>
                    <span className="font-semibold text-neon-green">
                      {analyses.length > 0
                        ? new Date(analyses[0].createdAt).toLocaleDateString()
                        : 'None'
                      }
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions Card */}
            <Card className="rounded-2xl border border-emerald-500/30 bg-zinc-900/40 shadow-sm">
              <CardHeader>
                <Users className="h-10 w-10 text-neon-green mb-2" />
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Common analytics tasks and tools
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>• 📊 Performance tracking</p>
                  <p>• 👥 Member analytics</p>
                  <p>• 📈 Trend analysis</p>
                  <p>• 📋 Export reports</p>
                  <p className="text-emerald-500 font-semibold mt-4">✓ AI Analysis Active</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Analysis Results Section */}
          <div className="mt-8">
            <LazyClubResults
              analyses={analyses}
              onExport={handleExportAnalysis}
              loading={isLoadingResults}
            />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
