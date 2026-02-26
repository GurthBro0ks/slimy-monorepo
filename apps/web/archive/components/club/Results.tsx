"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import {
  BarChart3,
  TrendingUp,
  Users,
  Target,
  Lightbulb,
  CheckCircle,
  AlertCircle,
  Download,
  Eye,
  Calendar
} from "lucide-react";
import type { StoredClubAnalysis } from "@/lib/club/database";

interface ResultsProps {
  analyses: StoredClubAnalysis[];
  onExport?: (analysisId: string) => void;
  onViewDetails?: (analysis: StoredClubAnalysis) => void;
  loading?: boolean;
}

export function Results({ analyses, onExport, onViewDetails, loading }: ResultsProps) {
  const [selectedAnalysis, setSelectedAnalysis] = useState<StoredClubAnalysis | null>(null);

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-20 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (analyses.length === 0) {
    return (
      <Callout variant="note" className="text-center py-8">
        <BarChart3 className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-muted-foreground">No analysis results available yet.</p>
        <p className="text-sm text-muted-foreground mt-1">
          Upload some club screenshots to get started with AI-powered analytics.
        </p>
      </Callout>
    );
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "text-green-600";
    if (confidence >= 0.6) return "text-yellow-600";
    return "text-red-600";
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.8) return <Badge variant="default" className="bg-green-500">High</Badge>;
    if (confidence >= 0.6) return <Badge variant="default" className="bg-yellow-500">Medium</Badge>;
    return <Badge variant="default" className="bg-red-500">Low</Badge>;
  };

  const formatMetricValue = (value: any, unit?: string) => {
    if (typeof value === 'number') {
      if (unit === 'percentage') return `${(value * 100).toFixed(1)}%`;
      if (unit === 'count') return value.toLocaleString();
      return value.toFixed(2);
    }
    return String(value);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Analysis Results</h2>
        <Badge variant="outline">{analyses.length} analyses</Badge>
      </div>

      <div className="grid gap-6">
        {analyses.map((analysis) => (
          <Card key={analysis.id} className="rounded-2xl border border-emerald-500/30 bg-zinc-900/40 shadow-sm">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-neon-green" />
                    {analysis.title || `Analysis ${analysis.createdAt.toLocaleDateString()}`}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-4 mt-2">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(analysis.createdAt).toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Target className="h-4 w-4" />
                      Confidence: {getConfidenceBadge(analysis.confidence)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      {analysis.images.length} image{analysis.images.length !== 1 ? 's' : ''}
                    </span>
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  {onViewDetails && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewDetails(analysis)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Details
                    </Button>
                  )}
                  {onExport && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onExport(analysis.id)}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Export
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Summary */}
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-neon-green" />
                  Summary
                </h4>
                <p className="text-sm text-muted-foreground">{analysis.summary}</p>
              </div>

              {/* Metrics */}
              {analysis.metrics.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-neon-green" />
                    Key Metrics
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {analysis.metrics.map((metric) => (
                      <div key={metric.id} className="bg-zinc-800/50 rounded-lg p-3">
                        <div className="text-sm font-medium text-muted-foreground capitalize">
                          {metric.name.replace(/([A-Z])/g, ' $1').trim()}
                        </div>
                        <div className="text-lg font-bold text-neon-green">
                          {formatMetricValue(metric.value, metric.unit)}
                        </div>
                        <Badge variant="outline" className="text-xs mt-1">
                          {metric.category}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Preview */}
              <div className="pt-2 border-t border-zinc-700/50">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {analysis.metrics.length} metrics • Analysis complete
                  </span>
                  <span className={`font-medium ${getConfidenceColor(analysis.confidence)}`}>
                    {Math.round(analysis.confidence * 100)}% confidence
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detailed View Modal would go here */}
      {selectedAnalysis && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Detailed Analysis: {selectedAnalysis.title}</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedAnalysis(null)}
                className="absolute top-4 right-4"
              >
                ✕
              </Button>
            </CardHeader>
            <CardContent>
              {/* Detailed view content would go here */}
              <p>Detailed analysis view coming soon...</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
