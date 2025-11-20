'use client';

import { useState, useEffect } from 'react';
import type {
  RadarSnapshot,
  OpportunityDomain,
  Opportunity,
  RiskLevel,
} from './types';
import './styles.css';

type DomainGroup = 'markets' | 'trends' | 'legal' | 'promo';

const DOMAIN_GROUPS: Record<DomainGroup, OpportunityDomain[]> = {
  markets: ['stocks', 'crypto'],
  trends: ['video', 'search'],
  legal: ['legal'],
  promo: ['promo'],
};

const DOMAIN_LABELS: Record<OpportunityDomain, string> = {
  stocks: 'Stocks',
  crypto: 'Crypto',
  video: 'Video Trends',
  search: 'Search Trends',
  legal: 'Class Actions',
  promo: 'Freebies & Promos',
};

const RISK_COLORS: Record<RiskLevel, string> = {
  low: '#10b981',
  medium: '#f59e0b',
  high: '#ef4444',
};

export default function OpportunitiesRadarClient() {
  const [snapshot, setSnapshot] = useState<RadarSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [selectedMode, setSelectedMode] = useState<'quick' | 'daily'>('quick');
  const [maxPerDomain, setMaxPerDomain] = useState(5);
  const [selectedDomainGroups, setSelectedDomainGroups] = useState<Set<DomainGroup>>(
    new Set(['markets', 'trends', 'legal', 'promo'])
  );

  // Debug toggle
  const [showDebug, setShowDebug] = useState(false);

  // Fetch data from the opps-api
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          mode: selectedMode,
          maxPerDomain: maxPerDomain.toString(),
        });

        const response = await fetch(`/api/radar?${params}`);

        if (!response.ok) {
          throw new Error(`API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        setSnapshot(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch opportunities');
        setSnapshot(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedMode, maxPerDomain]);

  // Get active domains based on selected groups
  const getActiveDomains = (): Set<OpportunityDomain> => {
    const domains = new Set<OpportunityDomain>();
    selectedDomainGroups.forEach((group) => {
      DOMAIN_GROUPS[group].forEach((domain) => domains.add(domain));
    });
    return domains;
  };

  // Toggle domain group selection
  const toggleDomainGroup = (group: DomainGroup) => {
    const newGroups = new Set(selectedDomainGroups);
    if (newGroups.has(group)) {
      newGroups.delete(group);
    } else {
      newGroups.add(group);
    }
    setSelectedDomainGroups(newGroups);
  };

  // Filter opportunities based on selected domains
  const getFilteredOpportunities = (): Record<OpportunityDomain, Opportunity[]> => {
    if (!snapshot || !snapshot.topByCategory) return {} as Record<OpportunityDomain, Opportunity[]>;

    const activeDomains = getActiveDomains();
    const filtered: Record<string, Opportunity[]> = {};

    Object.entries(snapshot.topByCategory).forEach(([domain, opps]) => {
      if (activeDomains.has(domain as OpportunityDomain) && opps) {
        filtered[domain] = opps;
      }
    });

    return filtered as Record<OpportunityDomain, Opportunity[]>;
  };

  // Render loading state
  if (loading) {
    return (
      <div className="opps-container">
        <div className="opps-loading">Loading opportunities...</div>
      </div>
    );
  }

  // Render error state
  if (error || (snapshot && !snapshot.ok)) {
    return (
      <div className="opps-container">
        <div className="opps-error">
          <h2>Error Loading Opportunities</h2>
          <p>{error || snapshot?.error || 'Unknown error occurred'}</p>
        </div>
      </div>
    );
  }

  const filteredOpps = getFilteredOpportunities();
  const totalFiltered = Object.values(filteredOpps).reduce(
    (sum, opps) => sum + opps.length,
    0
  );

  return (
    <div className="opps-container">
      <header className="opps-header">
        <h1>Opportunities Radar</h1>
        <p className="opps-subtitle">Experimental view · Direct access only</p>
      </header>

      {/* Control Panel */}
      <div className="opps-controls">
        {/* Mode Switcher */}
        <div className="control-group">
          <label className="control-label">Mode:</label>
          <div className="mode-switcher">
            <button
              className={`mode-button ${selectedMode === 'quick' ? 'active' : ''}`}
              onClick={() => setSelectedMode('quick')}
            >
              Quick
            </button>
            <button
              className={`mode-button ${selectedMode === 'daily' ? 'active' : ''}`}
              onClick={() => setSelectedMode('daily')}
            >
              Daily
            </button>
          </div>
        </div>

        {/* Max Per Domain Slider */}
        <div className="control-group">
          <label className="control-label">
            Max per domain: <strong>{maxPerDomain}</strong>
          </label>
          <input
            type="range"
            min="1"
            max="20"
            value={maxPerDomain}
            onChange={(e) => setMaxPerDomain(Number(e.target.value))}
            className="slider"
          />
        </div>

        {/* Domain Filters */}
        <div className="control-group full-width">
          <label className="control-label">Filter by domain:</label>
          <div className="domain-filters">
            {(Object.keys(DOMAIN_GROUPS) as DomainGroup[]).map((group) => (
              <button
                key={group}
                className={`domain-pill ${selectedDomainGroups.has(group) ? 'active' : ''}`}
                onClick={() => toggleDomainGroup(group)}
              >
                {group === 'markets' && '📈 Markets'}
                {group === 'trends' && '📊 Trends'}
                {group === 'legal' && '⚖️ Class Actions'}
                {group === 'promo' && '🎁 Freebies'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results Summary */}
      {snapshot && (
        <div className="opps-summary">
          <p>
            Showing <strong>{totalFiltered}</strong> of{' '}
            <strong>{snapshot.totalCount}</strong> opportunities
            {snapshot.timestamp && (
              <span className="timestamp">
                {' '}
                · Updated {new Date(snapshot.timestamp).toLocaleString()}
              </span>
            )}
          </p>
        </div>
      )}

      {/* Opportunities Grid */}
      <div className="opps-grid">
        {Object.entries(filteredOpps).length === 0 ? (
          <div className="opps-empty">
            <p>No opportunities match the selected filters.</p>
          </div>
        ) : (
          Object.entries(filteredOpps).map(([domain, opps]) => (
            <section key={domain} className="domain-section">
              <h2 className="domain-header">
                {DOMAIN_LABELS[domain as OpportunityDomain]}{' '}
                <span className="count">({opps.length})</span>
              </h2>
              <div className="opportunities-list">
                {opps.map((opp) => (
                  <article key={opp.id} className="opportunity-card">
                    <div className="opp-header">
                      <h3 className="opp-title">{opp.title}</h3>
                      <span
                        className="risk-badge"
                        style={{ backgroundColor: RISK_COLORS[opp.riskLevel] }}
                      >
                        {opp.riskLevel}
                      </span>
                    </div>
                    <p className="opp-summary">{opp.shortSummary}</p>
                    <div className="opp-meta">
                      {opp.estimatedReward && (
                        <span className="meta-item">💰 {opp.estimatedReward}</span>
                      )}
                      {opp.estimatedTime && (
                        <span className="meta-item">⏱️ {opp.estimatedTime}</span>
                      )}
                      {opp.confidence !== undefined && (
                        <span className="meta-item">
                          📊 {Math.round(opp.confidence * 100)}% confidence
                        </span>
                      )}
                    </div>
                    {opp.source && (
                      <div className="opp-source">Source: {opp.source}</div>
                    )}
                  </article>
                ))}
              </div>
            </section>
          ))
        )}
      </div>

      {/* Debug Panel */}
      <details className="opps-debug" open={showDebug}>
        <summary onClick={(e) => {
          e.preventDefault();
          setShowDebug(!showDebug);
        }}>
          Debug Snapshot (for development)
        </summary>
        {showDebug && snapshot && (
          <pre className="debug-json">
            {JSON.stringify(snapshot, null, 2)}
          </pre>
        )}
      </details>
    </div>
  );
}
