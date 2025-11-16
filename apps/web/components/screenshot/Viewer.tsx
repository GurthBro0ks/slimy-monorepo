"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import {
  Eye,
  Download,
  GitCompare,
  Search,
  Filter,
  ZoomIn,
  ZoomOut,
  RotateCw,
  X,
  BarChart3,
  Lightbulb,
  CheckCircle,
  AlertCircle,
  Clock,
  Tag
} from "lucide-react";
import type { ScreenshotAnalysisResult, ScreenshotType } from "@/lib/screenshot/analyzer";

interface ScreenshotViewerProps {
  analyses: ScreenshotAnalysisResult[];
  onAnalyze?: (imageUrls: string[], type: ScreenshotType) => void;
  onCompare?: (analysis1: ScreenshotAnalysisResult, analysis2: ScreenshotAnalysisResult) => void;
  onExport?: (analysis: ScreenshotAnalysisResult) => void;
  loading?: boolean;
}

export function ScreenshotViewer({
  analyses,
  onAnalyze,
  onCompare,
  onExport,
  loading
}: ScreenshotViewerProps) {
  const [selectedAnalysis, setSelectedAnalysis] = useState<ScreenshotAnalysisResult | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedForComparison, setSelectedForComparison] = useState<ScreenshotAnalysisResult[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<ScreenshotType | "all">("all");
  const [zoomLevel, setZoomLevel] = useState(1);
  const [filteredAnalyses, setFilteredAnalyses] = useState<ScreenshotAnalysisResult[]>(analyses);

  // Filter and search analyses
  useEffect(() => {
    let filtered = analyses;

    // Filter by type
    if (filterType !== "all") {
      filtered = filtered.filter(analysis => analysis.screenshotType === filterType);
    }

    // Search by title, description, or tags
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(analysis =>
        analysis.analysis.title.toLowerCase().includes(term) ||
        analysis.analysis.description.toLowerCase().includes(term) ||
        analysis.analysis.tags.some(tag => tag.toLowerCase().includes(term)) ||
        analysis.analysis.summary.toLowerCase().includes(term)
      );
    }

    setFilteredAnalyses(filtered);
  }, [analyses, filterType, searchTerm]);

  const handleSelectForComparison = (analysis: ScreenshotAnalysisResult) => {
    if (selectedForComparison.includes(analysis)) {
      setSelectedForComparison(prev => prev.filter(a => a.id !== analysis.id));
    } else if (selectedForComparison.length < 2) {
      setSelectedForComparison(prev => [...prev, analysis]);
    }
  };

  const handleCompare = () => {
    if (selectedForComparison.length === 2 && onCompare) {
      onCompare(selectedForComparison[0], selectedForComparison[1]);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "text-green-600";
    if (confidence >= 0.6) return "text-yellow-600";
    return "text-red-600";
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.8) return <Badge className="bg-green-500">High Confidence</Badge>;
    if (confidence >= 0.6) return <Badge className="bg-yellow-500">Medium Confidence</Badge>;
    return <Badge className="bg-red-500">Low Confidence</Badge>;
  };

  const formatProcessingTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

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
              <div className="h-32 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Screenshot Analysis</h2>
          <p className="text-muted-foreground">
            AI-powered analysis of your screenshots
          </p>
        </div>

        <div className="flex gap-2">
          {selectedForComparison.length === 2 && (
            <Button
              onClick={handleCompare}
              className="bg-blue-500 hover:bg-blue-600"
            >
              <GitCompare className="h-4 w-4 mr-2" />
              Compare Selected
            </Button>
          )}

          {compareMode && (
            <Button
              variant="outline"
              onClick={() => {
                setCompareMode(false);
                setSelectedForComparison([]);
              }}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel Compare
            </Button>
          )}

          {!compareMode && analyses.length > 1 && (
            <Button
              variant="outline"
              onClick={() => setCompareMode(true)}
            >
              <GitCompare className="h-4 w-4 mr-2" />
              Compare Mode
            </Button>
          )}
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search analyses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border rounded-lg bg-background"
          />
        </div>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as ScreenshotType | "all")}
          className="px-3 py-2 border rounded-lg bg-background"
        >
          <option value="all">All Types</option>
          <option value="game-stats">Game Stats</option>
          <option value="leaderboard">Leaderboard</option>
          <option value="profile">Profile</option>
          <option value="achievement">Achievements</option>
          <option value="inventory">Inventory</option>
          <option value="clan-guild">Clan/Guild</option>
          <option value="performance">Performance</option>
          <option value="social">Social</option>
          <option value="custom">Custom</option>
        </select>
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredAnalyses.length} of {analyses.length} analyses
      </div>

      {/* Analysis Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredAnalyses.map((analysis) => (
          <Card
            key={analysis.id}
            className={`rounded-2xl border transition-all cursor-pointer ${
              selectedAnalysis?.id === analysis.id ? 'ring-2 ring-blue-500' : ''
            } ${
              compareMode && selectedForComparison.includes(analysis) ? 'ring-2 ring-green-500' : ''
            }`}
            onClick={() => compareMode ? handleSelectForComparison(analysis) : setSelectedAnalysis(analysis)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg line-clamp-2">
                    {analysis.analysis.title}
                  </CardTitle>
                  <CardDescription className="line-clamp-2">
                    {analysis.analysis.description}
                  </CardDescription>
                </div>

                <div className="flex flex-col gap-1 ml-2">
                  {getConfidenceBadge(analysis.metadata.confidence)}
                  <Badge variant="outline" className="text-xs">
                    {analysis.screenshotType.replace('-', ' ')}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {new Date(analysis.timestamp).toLocaleDateString()}
                </span>
                <span className="flex items-center gap-1">
                  <BarChart3 className="h-3 w-3" />
                  {formatProcessingTime(analysis.metadata.processingTime)}
                </span>
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              {/* Screenshot thumbnail */}
              <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                <img
                  src={analysis.imageUrl}
                  alt={analysis.analysis.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>

              {/* Key insights */}
              <div>
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-1">
                  <Lightbulb className="h-3 w-3" />
                  Key Insights
                </h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  {analysis.analysis.insights.slice(0, 2).map((insight, index) => (
                    <li key={index} className="line-clamp-2">• {insight}</li>
                  ))}
                  {analysis.analysis.insights.length > 2 && (
                    <li className="text-blue-500">+{analysis.analysis.insights.length - 2} more</li>
                  )}
                </ul>
              </div>

              {/* Tags */}
              {analysis.analysis.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {analysis.analysis.tags.slice(0, 3).map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      <Tag className="h-2 w-2 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                  {analysis.analysis.tags.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{analysis.analysis.tags.length - 3}
                    </Badge>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedAnalysis(analysis);
                  }}
                >
                  <Eye className="h-3 w-3 mr-1" />
                  View
                </Button>

                {onExport && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onExport(analysis);
                    }}
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Export
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty state */}
      {filteredAnalyses.length === 0 && analyses.length === 0 && (
        <Callout variant="note" className="text-center py-8">
          <BarChart3 className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-muted-foreground">No screenshot analyses available yet.</p>
          <p className="text-sm text-muted-foreground mt-1">
            Upload some screenshots to get started with AI-powered analysis.
          </p>
        </Callout>
      )}

      {/* Empty search results */}
      {filteredAnalyses.length === 0 && analyses.length > 0 && (
        <Callout variant="note" className="text-center py-4">
          <Search className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
          <p className="text-muted-foreground">No analyses match your search criteria.</p>
          <p className="text-sm text-muted-foreground mt-1">
            Try adjusting your search terms or filters.
          </p>
        </Callout>
      )}

      {/* Detailed View Modal */}
      {selectedAnalysis && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-xl">{selectedAnalysis.analysis.title}</CardTitle>
                  <CardDescription className="mt-1">
                    {selectedAnalysis.analysis.description}
                  </CardDescription>

                  <div className="flex items-center gap-4 mt-3">
                    {getConfidenceBadge(selectedAnalysis.metadata.confidence)}
                    <Badge variant="outline">{selectedAnalysis.screenshotType.replace('-', ' ')}</Badge>
                    <span className="text-sm text-muted-foreground">
                      {new Date(selectedAnalysis.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedAnalysis(null)}
                  className="ml-4"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Screenshot with zoom controls */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Screenshot</h3>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.25))}
                    >
                      <ZoomOut className="h-3 w-3" />
                    </Button>
                    <span className="text-sm self-center px-2">{Math.round(zoomLevel * 100)}%</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setZoomLevel(Math.min(3, zoomLevel + 0.25))}
                    >
                      <ZoomIn className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <div className="border rounded-lg overflow-hidden bg-muted">
                  <img
                    src={selectedAnalysis.imageUrl}
                    alt={selectedAnalysis.analysis.title}
                    className="w-full transition-transform duration-200"
                    style={{ transform: `scale(${zoomLevel})` }}
                  />
                </div>
              </div>

              {/* Summary */}
              <div>
                <h3 className="font-semibold mb-2">Summary</h3>
                <p className="text-muted-foreground">{selectedAnalysis.analysis.summary}</p>
              </div>

              {/* Data Extracted */}
              {Object.keys(selectedAnalysis.analysis.data).length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Extracted Data</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Object.entries(selectedAnalysis.analysis.data).map(([key, value]) => (
                      <div key={key} className="bg-muted p-3 rounded-lg">
                        <div className="font-medium text-sm capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </div>
                        <div className="text-lg font-semibold text-blue-600">
                          {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Insights */}
              {selectedAnalysis.analysis.insights.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Lightbulb className="h-4 w-4" />
                    Insights
                  </h3>
                  <ul className="space-y-2">
                    {selectedAnalysis.analysis.insights.map((insight, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{insight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommendations */}
              {selectedAnalysis.analysis.recommendations.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Recommendations
                  </h3>
                  <ul className="space-y-2">
                    {selectedAnalysis.analysis.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                        <span className="text-sm">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Tags */}
              {selectedAnalysis.analysis.tags.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedAnalysis.analysis.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary">
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div className="pt-4 border-t">
                <h3 className="font-semibold mb-3">Analysis Details</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Processing Time</div>
                    <div className="font-medium">{formatProcessingTime(selectedAnalysis.metadata.processingTime)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Confidence</div>
                    <div className={`font-medium ${getConfidenceColor(selectedAnalysis.metadata.confidence)}`}>
                      {Math.round(selectedAnalysis.metadata.confidence * 100)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Model</div>
                    <div className="font-medium">{selectedAnalysis.metadata.modelUsed}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Analysis ID</div>
                    <div className="font-medium font-mono text-xs">{selectedAnalysis.id}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
