import { Metadata } from 'next';
import { LazyAnalyticsDashboard } from '@/components/lazy';
import { SlimyErrorBoundary } from '@/components/slimy-error-boundary';

export const metadata: Metadata = {
  title: 'Analytics Dashboard | Slimy.ai',
  description: 'Comprehensive analytics and statistics dashboard for Slimy.ai',
};

export default function AnalyticsPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <SlimyErrorBoundary componentName="Analytics Dashboard">
        <LazyAnalyticsDashboard />
      </SlimyErrorBoundary>
    </div>
  );
}
