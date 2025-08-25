const CACHE_NAME = 'llm-builder-v1';
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/vite.svg'
];

// Simple cache-first strategy for static assets and stale-while-revalidate for API
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.map((key) => {
        if (key !== CACHE_NAME) return caches.delete(key);
      }));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API responses: try network first, fallback to cache
  if (url.pathname.startsWith('/api/') || url.pathname.includes('/db/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (!response || response.status !== 200) return response;
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Static assets: cache first
  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request).then((response) => {
      // Cache successful GET requests
      if (request.method === 'GET' && response && response.status === 200) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
      }
      return response;
    }).catch(() => {
      // Fallback to homepage for navigation requests
      if (request.mode === 'navigate') return caches.match('/');
      return new Response(null, { status: 504, statusText: 'Offline' });
    }))
  );
});
