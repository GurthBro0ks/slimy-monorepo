"use client";

import { useServiceWorker } from '@/lib/service-worker';

/**
 * Service Worker Registration Component
 * Registers the service worker in production builds
 */
export function ServiceWorkerRegistration() {
  useServiceWorker();
  return null;
}

