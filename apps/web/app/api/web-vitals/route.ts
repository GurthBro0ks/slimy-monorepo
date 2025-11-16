/**
 * Web Vitals API Route
 *
 * Receives and stores Core Web Vitals metrics from client
 */

import { NextRequest, NextResponse } from 'next/server';
import { getLogger } from '@/lib/monitoring/logger';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // Log web vitals metric
    const logger = getLogger();
    logger.info('Web Vitals metric received', {
      metric: data.metric,
      value: data.value,
      rating: data.rating,
      url: data.url,
      userAgent: data.userAgent,
      connection: data.connection,
    });

    // TODO: Store in database or send to analytics service
    // For now, we just log it

    return NextResponse.json({ ok: true });
  } catch (error) {
    const logger = getLogger();
    logger.error('Failed to process web vitals', error as Error);

    return NextResponse.json(
      { ok: false, error: 'Failed to process web vitals' },
      { status: 500 }
    );
  }
}
