// Service Worker for offline caching and performance
// This service worker caches static assets and API responses for offline use

const CACHE_NAME = 'slimyai-v1';
const STATIC_CACHE_NAME = 'slimyai-static-v1';
const API_CACHE_NAME = 'slimyai-api-v1';

// Assets to cache immediately on install
const STATIC_ASSETS = [
  '/',
  '/features',
  '/docs',
  '/status',
];

// API endpoints to cache (with short TTL)
const API_CACHE_PATTERNS = [
  /^\/api\/health/,
  /^\/api\/status/,
];

// Maximum cache age (in seconds)
const STATIC_CACHE_MAX_AGE = 7 * 24 * 60 * 60; // 7 days
const API_CACHE_MAX_AGE = 5 * 60; // 5 minutes

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('Failed to cache some static assets:', err);
      });
    })
  );
  // Skip waiting to activate immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => {
            return (
              name !== STATIC_CACHE_NAME &&
              name !== API_CACHE_NAME &&
              name !== CACHE_NAME
            );
          })
          .map((name) => caches.delete(name))
      );
    })
  );
  // Take control of all pages immediately
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip cross-origin requests
  if (url.origin !== self.location.origin) {
    return;
  }

  // Handle API requests with network-first strategy
  if (url.pathname.startsWith('/api/')) {
    const isCacheable = API_CACHE_PATTERNS.some((pattern) =>
      pattern.test(url.pathname)
    );

    if (isCacheable) {
      event.respondWith(
        networkFirstStrategy(request, API_CACHE_NAME, API_CACHE_MAX_AGE)
      );
      return;
    }
  }

  // Handle static assets with cache-first strategy
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/_next/image') ||
    url.pathname.startsWith('/images/') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.webp')
  ) {
    event.respondWith(
      cacheFirstStrategy(request, STATIC_CACHE_NAME, STATIC_CACHE_MAX_AGE)
    );
    return;
  }

  // Handle page requests with stale-while-revalidate strategy
  if (request.headers.get('accept') && request.headers.get('accept').includes('text/html')) {
    event.respondWith(
      staleWhileRevalidateStrategy(request, STATIC_CACHE_NAME)
    );
    return;
  }

  // Default: network-first for everything else
  event.respondWith(fetch(request));
});

// Cache-first strategy: Check cache first, fallback to network
async function cacheFirstStrategy(request, cacheName, maxAge) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  if (cached) {
    const cachedDate = cached.headers.get('date');
    if (cachedDate) {
      const age = (Date.now() - new Date(cachedDate).getTime()) / 1000;
      if (age < maxAge) {
        return cached;
      }
    } else {
      return cached;
    }
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    // Return cached version even if expired if network fails
    if (cached) {
      return cached;
    }
    throw error;
  }
}

// Network-first strategy: Try network first, fallback to cache
async function networkFirstStrategy(request, cacheName, maxAge) {
  const cache = await caches.open(cacheName);

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) {
      const cachedDate = cached.headers.get('date');
      if (cachedDate) {
        const age = (Date.now() - new Date(cachedDate).getTime()) / 1000;
        if (age < maxAge) {
          return cached;
        }
      } else {
        return cached;
      }
    }
    throw error;
  }
}

// Stale-while-revalidate strategy: Return cached immediately, update in background
async function staleWhileRevalidateStrategy(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  // Fetch fresh version in background
  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  });

  // Return cached version immediately if available
  if (cached) {
    fetchPromise.catch(() => {
      // Ignore background fetch errors
    });
    return cached;
  }

  // If no cache, wait for network
  return fetchPromise;
}

