const CACHE_NAME = 'echoscribe-v2';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Install Event — Pre-caches index and core files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch(err => {
        console.warn('Pre-caching warning on install: ', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate Event — Cleans up old cache schemas
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event — Network First, falling back to Cache
self.addEventListener('fetch', (event) => {
  // Skip non-GET, external API resources, or chrome extension requests
  if (
    event.request.method !== 'GET' || 
    !event.request.url.startsWith(self.location.origin)
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache success responses
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Offline: Fallback to Cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // If offline and request is document navigation, return index.html
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
      })
  );
});

// Widget Click Event — Focuses or opens the app window to the emergency page when widget is clicked
self.addEventListener('widgetclick', (event) => {
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // If app window is already open, focus it and navigate to emergency route
      for (const client of windowClients) {
        if (client.url.startsWith(self.location.origin)) {
          client.navigate('./index.html#/emergency');
          return client.focus();
        }
      }
      // Otherwise, open a new app window directly to emergency route
      return self.clients.openWindow('./index.html#/emergency');
    })
  );
});
