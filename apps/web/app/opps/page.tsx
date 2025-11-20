import { OpportunitiesRadarClient } from './OpportunitiesRadarClient';

export const metadata = {
  title: 'Opportunity Radar (Experimental) | Slimy',
  description: 'Experimental UI for browsing detected opportunities from the Slimy opportunity radar system',
};

export default function OpportunitiesRadarPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Opportunity Radar (Experimental)
        </h1>

        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 mb-6">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> This is an experimental interface and is not yet integrated with the main site navigation or authentication system.
            You must navigate directly to <code className="bg-yellow-100 px-1 rounded">/opps</code> to access this page.
          </p>
        </div>

        <div className="prose prose-gray max-w-none">
          <p className="text-gray-700">
            This page displays opportunities detected by the Slimy opportunity radar system.
            Opportunities are analyzed, scored, and grouped by domain to help you identify
            potentially valuable actions you can take.
          </p>
          <p className="text-gray-600 text-sm mt-2">
            The data is fetched from the opps-api service. Make sure the service is running
            and accessible via the configured API endpoint.
          </p>
        </div>
      </div>

      <OpportunitiesRadarClient />
    </div>
  );
}
