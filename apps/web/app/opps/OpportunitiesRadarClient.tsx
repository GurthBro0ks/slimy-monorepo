'use client';

import { useEffect, useState } from 'react';
import type { RadarSnapshot, ScoredOpportunity, RadarApiError } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_OPPS_API_BASE_URL || 'http://localhost:4010';

export function OpportunitiesRadarClient() {
  const [data, setData] = useState<RadarSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRadar = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`${API_BASE_URL}/radar?mode=quick&maxPerDomain=5`);

        if (!response.ok) {
          const errorData: RadarApiError = await response.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const snapshot: RadarSnapshot = await response.json();
        setData(snapshot);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch opportunities');
      } finally {
        setLoading(false);
      }
    };

    fetchRadar();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-4 text-gray-600">Loading opportunities...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6">
        <h3 className="text-lg font-semibold text-red-900">Error Loading Opportunities</h3>
        <p className="mt-2 text-red-700">{error}</p>
        <p className="mt-4 text-sm text-red-600">
          Make sure the opps-api service is running at: <code className="rounded bg-red-100 px-2 py-1">{API_BASE_URL}</code>
        </p>
      </div>
    );
  }

  if (!data || Object.keys(data.byDomain).length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-6">
        <p className="text-gray-600">No opportunities found at this time.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Metadata */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <div className="flex flex-wrap gap-6 text-sm">
          <div>
            <span className="font-medium text-gray-700">Last Updated:</span>{' '}
            <span className="text-gray-600">{new Date(data.generatedAt).toLocaleString()}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Mode:</span>{' '}
            <span className="text-gray-600">{data.mode}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Total Scanned:</span>{' '}
            <span className="text-gray-600">{data.totalScanned}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Opportunities Found:</span>{' '}
            <span className="text-gray-600">{data.totalOpportunities}</span>
          </div>
        </div>
      </div>

      {/* Opportunities by Domain */}
      <div className="space-y-8">
        {Object.entries(data.byDomain).map(([domain, opportunities]) => (
          <div key={domain} className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900 border-b pb-2">
              {domain}
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({opportunities.length} {opportunities.length === 1 ? 'opportunity' : 'opportunities'})
              </span>
            </h2>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {opportunities.map((scoredOpp) => (
                <OpportunityCard key={scoredOpp.opportunity.id} scoredOpp={scoredOpp} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function OpportunityCard({ scoredOpp }: { scoredOpp: ScoredOpportunity }) {
  const { opportunity, score, reason } = scoredOpp;

  const getRiskColor = (risk?: string) => {
    switch (risk) {
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
      {/* Score Badge */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 line-clamp-2">
            {opportunity.url ? (
              <a
                href={opportunity.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-blue-600 hover:underline"
              >
                {opportunity.title}
              </a>
            ) : (
              opportunity.title
            )}
          </h3>
        </div>
        <div className="ml-2 flex-shrink-0">
          <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
            {score.toFixed(1)}
          </span>
        </div>
      </div>

      {/* Summary */}
      {opportunity.shortSummary && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-3">
          {opportunity.shortSummary}
        </p>
      )}

      {/* Metrics */}
      <div className="space-y-2 mb-3">
        {opportunity.estimatedReward !== undefined && (
          <div className="flex items-center text-sm">
            <span className="text-gray-500 w-20">Reward:</span>
            <span className="font-medium text-gray-900">${opportunity.estimatedReward}</span>
          </div>
        )}
        {opportunity.estimatedTimeMinutes !== undefined && (
          <div className="flex items-center text-sm">
            <span className="text-gray-500 w-20">Time:</span>
            <span className="font-medium text-gray-900">{opportunity.estimatedTimeMinutes} min</span>
          </div>
        )}
        {opportunity.riskLevel && (
          <div className="flex items-center text-sm">
            <span className="text-gray-500 w-20">Risk:</span>
            <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium border ${getRiskColor(opportunity.riskLevel)}`}>
              {opportunity.riskLevel}
            </span>
          </div>
        )}
      </div>

      {/* Reason */}
      {reason && (
        <p className="text-xs text-gray-500 italic border-t pt-2 mt-2">
          {reason}
        </p>
      )}

      {/* Tags */}
      {opportunity.tags && opportunity.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {opportunity.tags.map((tag, idx) => (
            <span
              key={idx}
              className="inline-block rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
