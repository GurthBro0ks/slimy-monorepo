"use client";

import { useEffect, useState } from 'react';

export type OfficeStatus = 'connecting' | 'connected' | 'error';

export interface OfficeState {
  status: OfficeStatus;
  sessions: unknown[] | null;
  presence: unknown | null;
  lastUpdated: number | null;
}

export function useOfficeState(): OfficeState {
  const [status, setStatus] = useState<OfficeStatus>('connecting');
  const [sessions, setSessions] = useState<unknown[] | null>(null);
  const [presence, setPresence] = useState<unknown | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  useEffect(() => {
    // Ensure this only runs on the client
    if (typeof window === 'undefined') return;

    const eventSource = new EventSource('/api/office/stream');

    eventSource.onopen = () => {
      setStatus('connected');
    };

    eventSource.onerror = () => {
      setStatus('error');
      eventSource.close();
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.status === 'connected') {
          setStatus('connected');
          return;
        }

        if (data.type === 'state-update') {
          setSessions(data.sessions || []);
          setPresence(data.presence);
          setLastUpdated(data.timestamp);
        } else if (data.type === 'error') {
          console.error('Stream error:', data.message);
          setStatus('error');
        }
      } catch (e) {
        console.error('Failed to parse SSE message', e);
      }
    };

    return () => {
      eventSource.close();
    };
  }, []);

  return { status, sessions, presence, lastUpdated };
}
