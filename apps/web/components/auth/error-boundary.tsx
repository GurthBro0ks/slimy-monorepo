"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class AuthErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error to console or error reporting service
    console.error("Authentication Error Boundary caught an error:", error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // You could also log to an error reporting service here
    // Example: Sentry.captureException(error, { contexts: { errorInfo } });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      // Check if this is an authentication-related error
      const isAuthError = this.state.error?.message?.toLowerCase().includes("auth") ||
                         this.state.error?.message?.toLowerCase().includes("unauthorized") ||
                         this.state.error?.message?.toLowerCase().includes("forbidden");

      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <CardTitle className="text-xl">
                {isAuthError ? "Authentication Error" : "Something went wrong"}
              </CardTitle>
              <CardDescription>
                {isAuthError
                  ? "There was a problem with your authentication. Please try logging in again."
                  : "An unexpected error occurred. Please try refreshing the page."
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button onClick={this.handleRetry} className="flex-1">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
                <Button variant="outline" onClick={this.handleGoHome} className="flex-1">
                  <Home className="mr-2 h-4 w-4" />
                  Go Home
                </Button>
              </div>

              {process.env.NODE_ENV === "development" && this.state.error && (
                <details className="mt-4 rounded-md bg-muted p-3">
                  <summary className="cursor-pointer text-sm font-medium">
                    Error Details (Development Only)
                  </summary>
                  <pre className="mt-2 whitespace-pre-wrap text-xs text-muted-foreground">
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </pre>
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

// Hook for using error boundary in functional components
export function useAuthErrorHandler() {
  return (error: Error, errorInfo?: { componentStack?: string }) => {
    console.error("Authentication error:", error, errorInfo);
    // You could also trigger a toast notification or other UI feedback here
  };
}
