const CACHE_NAME = 'ferrehogar-v2';
const API_CACHE = 'ferrehogar-api-v1';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.ico',
];

// API patterns to cache with stale-while-revalidate
const CACHEABLE_API_PATTERNS = [
  '/rest/v1/products',
  '/rest/v1/categories',
  '/rest/v1/product_prices',
  '/rest/v1/product_images',
  '/rest/v1/reviews',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME && k !== API_CACHE)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

function isCacheableAPI(url) {
  return CACHEABLE_API_PATTERNS.some((pattern) => url.includes(pattern));
}

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip auth and function calls
  if (request.url.includes('/auth/') || request.url.includes('/functions/')) return;

  // Stale-while-revalidate for API calls
  if (isCacheableAPI(request.url)) {
    event.respondWith(
      caches.open(API_CACHE).then(async (cache) => {
        const cached = await cache.match(request);

        const fetchPromise = fetch(request)
          .then((response) => {
            if (response.ok) {
              cache.put(request, response.clone());
            }
            return response;
          })
          .catch(() => {
            // Offline: return cached or error
            return cached || new Response(JSON.stringify({ error: 'Offline' }), {
              status: 503,
              headers: { 'Content-Type': 'application/json' },
            });
          });

        // Return cached immediately if available, otherwise wait for network
        return cached || fetchPromise;
      })
    );
    return;
  }

  // Static assets: network-first with cache fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok && request.url.match(/\.(js|css|png|jpg|svg|ico|woff2?)$/)) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() =>
        caches.match(request).then(
          (cached) =>
            cached ||
            new Response('Offline', { status: 503 })
        )
      )
  );
});
