var CACHE_NAME = 'spare-parts-v5';

self.addEventListener('install', function(event) {
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          // Delete ALL old caches
          return caches.delete(cacheName);
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(event) {
  // Network first — always get latest version
  // Only fall back to cache if offline
  event.respondWith(
    fetch(event.request.clone())
      .then(function(response) {
        // Cache the fresh response
        if (response && response.status === 200 && response.type === 'basic') {
          var responseToCache = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(function() {
        // Offline — use cache
        return caches.match(event.request);
      })
  );
});
