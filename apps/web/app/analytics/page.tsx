import { Metadata } from 'next';
import { LazyAnalyticsDashboard } from '@/components/lazy';

export const metadata: Metadata = {
  title: 'Analytics Dashboard | Slimy.ai',
  description: 'Comprehensive analytics and statistics dashboard for Slimy.ai',
};

export default function AnalyticsPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <LazyAnalyticsDashboard />
    </div>
  );
}
