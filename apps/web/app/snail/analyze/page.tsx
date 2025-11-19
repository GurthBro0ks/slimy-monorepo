import { Metadata } from 'next';
import { LazyScreenshotViewer } from '@/components/lazy';
import { SlimyErrorBoundary } from '@/components/slimy-error-boundary';
import { Suspense } from 'react';
import { LoadingFallback } from '@/lib/lazy';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Image } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Screenshot Analyzer | Snail Tools',
  description: 'Upload and analyze Super Snail screenshots with AI-powered insights',
};

export default function SnailAnalyzePage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="mb-2 text-4xl font-bold flex items-center gap-3">
          <Image className="h-10 w-10 text-neon-green" />
          Screenshot Analyzer
        </h1>
        <p className="text-muted-foreground">
          Upload your Super Snail screenshots for AI-powered analysis and insights
        </p>
      </div>

      <Card className="rounded-2xl border border-emerald-500/30 bg-zinc-900/40 shadow-sm">
        <CardHeader>
          <CardTitle>Image Analysis Viewer</CardTitle>
          <CardDescription>
            Complex image processing and metadata extraction viewer with error protection
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<LoadingFallback height="600px" />}>
            <SlimyErrorBoundary componentName="Screenshot Viewer">
              <LazyScreenshotViewer analyses={[]} />
            </SlimyErrorBoundary>
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
