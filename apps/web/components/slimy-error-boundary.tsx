"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  componentName?: string;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

/**
 * SlimyErrorBoundary - A reusable error boundary for protecting risky UI components
 *
 * Wraps complex/risky components (charts, dashboards, data visualizations) to prevent
 * them from crashing the entire page. Displays a friendly fallback UI and logs errors.
 *
 * @example
 * ```tsx
 * <SlimyErrorBoundary componentName="Analytics Dashboard">
 *   <AnalyticsDashboard />
 * </SlimyErrorBoundary>
 * ```
 */
export class SlimyErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const componentName = this.props.componentName || "Unknown Component";

    // Log the error to console (client-safe logging)
    console.error(
      `[SlimyErrorBoundary] Error in ${componentName}:`,
      {
        error,
        errorInfo,
        componentName,
        componentStack: errorInfo.componentStack,
        errorName: error.name,
        errorMessage: error.message,
        timestamp: new Date().toISOString(),
      }
    );

    // You can also send to an error reporting service here (e.g., Sentry)
    // Example: Sentry.captureException(error, { contexts: { errorInfo, componentName } });

    this.setState({
      error,
      errorInfo,
    });

    // Call optional error handler callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    // Reset error state to retry rendering the component
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI - inline panel style (doesn't take over full screen)
      return (
        <div className="flex items-center justify-center p-4">
          <Card className="w-full max-w-lg border-destructive/50">
            <CardHeader>
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg">
                    {this.props.componentName || "This panel"} failed to load
                  </CardTitle>
                  <CardDescription className="mt-1">
                    An error occurred while rendering this component. Try refreshing, or come back later.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={this.handleRetry} variant="outline" className="w-full">
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>

              {process.env.NODE_ENV === "development" && this.state.error && (
                <details className="rounded-md border border-muted bg-muted/30 p-3">
                  <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
                    Error Details (Development Only)
                  </summary>
                  <div className="mt-3 space-y-2">
                    <div className="rounded bg-destructive/10 p-2">
                      <p className="text-xs font-semibold text-destructive">
                        {this.state.error.name}: {this.state.error.message}
                      </p>
                    </div>
                    <pre className="max-h-40 overflow-auto whitespace-pre-wrap rounded bg-black/5 p-2 text-xs text-muted-foreground dark:bg-white/5">
                      {this.state.error.stack}
                    </pre>
                    {this.state.errorInfo?.componentStack && (
                      <pre className="max-h-40 overflow-auto whitespace-pre-wrap rounded bg-black/5 p-2 text-xs text-muted-foreground dark:bg-white/5">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    )}
                  </div>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Lightweight error boundary fallback for less critical components
 * Shows a minimal error message without fancy UI
 */
export function MinimalErrorFallback({ componentName }: { componentName?: string }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/5 p-4 text-sm text-muted-foreground">
      <AlertTriangle className="h-4 w-4 text-destructive" />
      <span>
        {componentName || "This component"} failed to load. Please refresh the page.
      </span>
    </div>
  );
}
