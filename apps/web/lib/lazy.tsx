import React, { Suspense, ComponentType } from 'react';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Loading fallback component
 */
export const LoadingFallback = ({ height = '200px', className = '' }: { height?: string; className?: string }) => (
  <div className={`animate-pulse ${className}`}>
    <Skeleton className="w-full" style={{ height }} />
  </div>
);

/**
 * Loading spinner for heavy components
 */
export const LoadingSpinner = ({ size = 'sm' }: { size?: 'sm' | 'md' | 'lg' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  return (
    <div className="flex items-center justify-center p-4">
      <div className={`animate-spin rounded-full border-b-2 border-gray-900 ${sizeClasses[size]}`}></div>
    </div>
  );
};

/**
 * Full page loading spinner
 */
export const PageLoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <LoadingSpinner size="lg" />
  </div>
);

/**
 * Lazy load component using Next.js dynamic imports
 * This provides better performance than React.lazy for Next.js apps
 */
export function lazyLoad<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  options: {
    loading?: ComponentType<any>;
    ssr?: boolean;
  } = {}
): T {
  const { loading = LoadingSpinner, ssr = false } = options;
  const LoadingComponent = loading;

  return dynamic(importFunc, {
    loading: LoadingComponent
      ? () => <LoadingComponent />
      : undefined,
    ssr,
  }) as T;
}

/**
 * Lazy load a heavy component with spinner
 */
export function lazyLoadHeavy<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>
): T {
  return lazyLoad(importFunc, {
    loading: LoadingSpinner,
    ssr: false,
  });
}

/**
 * Lazy load a component that can be server-side rendered
 */
export function lazyLoadSSR<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>
): T {
  return lazyLoad(importFunc, {
    loading: LoadingFallback,
    ssr: true,
  });
}

/**
 * Preload a lazy component (call this on hover, etc.)
 */
export function preloadLazyComponent(
  importFunc: () => Promise<{ default: ComponentType<any> }>
): void {
  // Start the import but don't use the result
  importFunc().catch(() => {
    // Ignore preload failures
  });
}
