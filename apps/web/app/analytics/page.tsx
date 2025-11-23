import { Metadata } from 'next';
import { LazyAnalyticsDashboard } from '@/components/lazy';
import { CommandShell } from '@/components/CommandShell';

export const metadata: Metadata = {
  title: 'Analytics Dashboard | Slimy.ai',
  description: 'Comprehensive analytics and statistics dashboard for Slimy.ai',
};

export default function AnalyticsPage() {
  return (
    <CommandShell title="Analytics" breadcrumbs="Home / Analytics" statusText="Sheets + Usage: Pending">
      <div className="container mx-auto py-8 px-4">
        <LazyAnalyticsDashboard />
      </div>
    </CommandShell>
  );
}
