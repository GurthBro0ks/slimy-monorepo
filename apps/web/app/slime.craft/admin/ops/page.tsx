'use client';

import React, { useState, useEffect } from 'react';

interface StatusPing {
  id: number;
  timestamp: string;
  online: boolean;
  latencyMs: number | null;
  playerCount: number | null;
}

interface Backup {
  id: number;
  label: string | null;
  createdAt: string;
  sizeMb: number | null;
  notes: string | null;
  triggeredBy: string | null;
}

interface BackupFormData {
  label: string;
  sizeMb: string;
  notes: string;
}

export default function SlimecraftOpsPage() {
  const [statusPings, setStatusPings] = useState<StatusPing[]>([]);
  const [backups, setBackups] = useState<Backup[]>([]);
  const [statusLoading, setStatusLoading] = useState(true);
  const [backupsLoading, setBackupsLoading] = useState(true);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [backupsError, setBackupsError] = useState<string | null>(null);
  const [formData, setFormData] = useState<BackupFormData>({
    label: '',
    sizeMb: '',
    notes: '',
  });

  // Fetch status history
  const fetchStatusHistory = async () => {
    try {
      setStatusLoading(true);
      setStatusError(null);
      const response = await fetch('/api/slimecraft/status-history/recent?limit=100');
      const data = await response.json();

      if (data.ok && data.pings) {
        setStatusPings(data.pings);
      } else {
        setStatusError(data.error || 'Failed to fetch status history');
      }
    } catch (error) {
      console.error('Error fetching status history:', error);
      setStatusError('Network error fetching status history');
    } finally {
      setStatusLoading(false);
    }
  };

  // Fetch backups
  const fetchBackups = async () => {
    try {
      setBackupsLoading(true);
      setBackupsError(null);
      const response = await fetch('/api/slimecraft/backups?limit=50');
      const data = await response.json();

      if (data.ok && data.backups) {
        setBackups(data.backups);
      } else {
        setBackupsError(data.error || 'Failed to fetch backups');
      }
    } catch (error) {
      console.error('Error fetching backups:', error);
      setBackupsError('Network error fetching backups');
    } finally {
      setBackupsLoading(false);
    }
  };

  // Submit new backup log
  const handleSubmitBackup = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setFormSubmitting(true);
      const response = await fetch('/api/slimecraft/backups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          label: formData.label || null,
          sizeMb: formData.sizeMb ? parseInt(formData.sizeMb) : null,
          notes: formData.notes || null,
        }),
      });

      const data = await response.json();

      if (data.ok) {
        // Reset form
        setFormData({ label: '', sizeMb: '', notes: '' });
        // Refresh backups list
        await fetchBackups();
      } else {
        alert(`Failed to create backup log: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error creating backup log:', error);
      alert('Network error creating backup log');
    } finally {
      setFormSubmitting(false);
    }
  };

  useEffect(() => {
    fetchStatusHistory();
    fetchBackups();
  }, []);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  const getUptimePercentage = () => {
    if (statusPings.length === 0) return 0;
    const onlineCount = statusPings.filter(p => p.online).length;
    return ((onlineCount / statusPings.length) * 100).toFixed(1);
  };

  const getCurrentStatus = () => {
    if (statusPings.length === 0) return 'Unknown';
    return statusPings[0].online ? 'Online' : 'Offline';
  };

  return (
    <div style={{
      padding: '2rem',
      maxWidth: '1400px',
      margin: '0 auto',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
        Slime.craft Ops Dashboard
      </h1>
      <p style={{ color: '#666', marginBottom: '2rem' }}>
        Server status monitoring and backup logs
      </p>

      {/* Status History Section */}
      <section style={{
        marginBottom: '3rem',
        padding: '1.5rem',
        border: '1px solid #e0e0e0',
        borderRadius: '8px',
        backgroundColor: '#fafafa',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
        }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600' }}>
            Status History
          </h2>
          <button
            onClick={fetchStatusHistory}
            disabled={statusLoading}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: statusLoading ? 'not-allowed' : 'pointer',
              opacity: statusLoading ? 0.6 : 1,
            }}
          >
            {statusLoading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {/* Status Summary */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}>
          <div style={{
            padding: '1rem',
            backgroundColor: 'white',
            borderRadius: '6px',
            border: '1px solid #e0e0e0',
          }}>
            <div style={{ fontSize: '0.875rem', color: '#666' }}>Current Status</div>
            <div style={{
              fontSize: '1.25rem',
              fontWeight: 'bold',
              color: getCurrentStatus() === 'Online' ? '#4CAF50' : '#f44336',
            }}>
              {getCurrentStatus()}
            </div>
          </div>
          <div style={{
            padding: '1rem',
            backgroundColor: 'white',
            borderRadius: '6px',
            border: '1px solid #e0e0e0',
          }}>
            <div style={{ fontSize: '0.875rem', color: '#666' }}>Uptime (Last {statusPings.length} pings)</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
              {getUptimePercentage()}%
            </div>
          </div>
          <div style={{
            padding: '1rem',
            backgroundColor: 'white',
            borderRadius: '6px',
            border: '1px solid #e0e0e0',
          }}>
            <div style={{ fontSize: '0.875rem', color: '#666' }}>Total Pings</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
              {statusPings.length}
            </div>
          </div>
        </div>

        {statusError && (
          <div style={{
            padding: '1rem',
            backgroundColor: '#ffebee',
            color: '#c62828',
            borderRadius: '4px',
            marginBottom: '1rem',
          }}>
            {statusError}
          </div>
        )}

        {/* Status Table */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '6px',
          border: '1px solid #e0e0e0',
          overflowX: 'auto',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #e0e0e0' }}>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>Timestamp</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>Status</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>Latency (ms)</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>Players</th>
              </tr>
            </thead>
            <tbody>
              {statusLoading && statusPings.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
                    Loading status history...
                  </td>
                </tr>
              ) : statusPings.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
                    No status pings recorded yet
                  </td>
                </tr>
              ) : (
                statusPings.map((ping, index) => (
                  <tr
                    key={ping.id}
                    style={{
                      borderBottom: index < statusPings.length - 1 ? '1px solid #f0f0f0' : 'none',
                    }}
                  >
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>
                      {formatDate(ping.timestamp)}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        backgroundColor: ping.online ? '#e8f5e9' : '#ffebee',
                        color: ping.online ? '#2e7d32' : '#c62828',
                      }}>
                        {ping.online ? 'Online' : 'Offline'}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>
                      {ping.latencyMs !== null ? ping.latencyMs : '-'}
                    </td>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>
                      {ping.playerCount !== null ? ping.playerCount : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Backups Section */}
      <section style={{
        padding: '1.5rem',
        border: '1px solid #e0e0e0',
        borderRadius: '8px',
        backgroundColor: '#fafafa',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
        }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600' }}>
            Backup Logs
          </h2>
          <button
            onClick={fetchBackups}
            disabled={backupsLoading}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: backupsLoading ? 'not-allowed' : 'pointer',
              opacity: backupsLoading ? 0.6 : 1,
            }}
          >
            {backupsLoading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {/* New Backup Form */}
        <form
          onSubmit={handleSubmitBackup}
          style={{
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: '6px',
            border: '1px solid #e0e0e0',
            marginBottom: '1.5rem',
          }}
        >
          <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem' }}>
            Log New Backup
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            marginBottom: '1rem',
          }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                Label
              </label>
              <input
                type="text"
                placeholder="e.g., nightly, pre-reset"
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '0.875rem',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                Size (MB)
              </label>
              <input
                type="number"
                placeholder="Size in MB"
                value={formData.sizeMb}
                onChange={(e) => setFormData({ ...formData, sizeMb: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '0.875rem',
                }}
              />
            </div>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
              Notes
            </label>
            <textarea
              placeholder="Additional notes about this backup..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '0.875rem',
                fontFamily: 'inherit',
              }}
            />
          </div>
          <button
            type="submit"
            disabled={formSubmitting}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: formSubmitting ? 'not-allowed' : 'pointer',
              opacity: formSubmitting ? 0.6 : 1,
              fontWeight: '600',
            }}
          >
            {formSubmitting ? 'Logging...' : 'Log Backup'}
          </button>
        </form>

        {backupsError && (
          <div style={{
            padding: '1rem',
            backgroundColor: '#ffebee',
            color: '#c62828',
            borderRadius: '4px',
            marginBottom: '1rem',
          }}>
            {backupsError}
          </div>
        )}

        {/* Backups Table */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '6px',
          border: '1px solid #e0e0e0',
          overflowX: 'auto',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #e0e0e0' }}>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>Created At</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>Label</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>Size (MB)</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>Notes</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>Triggered By</th>
              </tr>
            </thead>
            <tbody>
              {backupsLoading && backups.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
                    Loading backups...
                  </td>
                </tr>
              ) : backups.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
                    No backups logged yet
                  </td>
                </tr>
              ) : (
                backups.map((backup, index) => (
                  <tr
                    key={backup.id}
                    style={{
                      borderBottom: index < backups.length - 1 ? '1px solid #f0f0f0' : 'none',
                    }}
                  >
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>
                      {formatDate(backup.createdAt)}
                    </td>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>
                      {backup.label || '-'}
                    </td>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>
                      {backup.sizeMb !== null ? backup.sizeMb.toLocaleString() : '-'}
                    </td>
                    <td style={{
                      padding: '0.75rem',
                      fontSize: '0.875rem',
                      maxWidth: '300px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {backup.notes || '-'}
                    </td>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>
                      {backup.triggeredBy || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* TODO: Add RBAC - This page should be operator-only */}
      <div style={{
        marginTop: '2rem',
        padding: '1rem',
        backgroundColor: '#fff3cd',
        borderRadius: '4px',
        fontSize: '0.875rem',
        color: '#856404',
      }}>
        <strong>TODO:</strong> This page currently has no access control.
        Implement RBAC to restrict access to operators only.
      </div>
    </div>
  );
}
