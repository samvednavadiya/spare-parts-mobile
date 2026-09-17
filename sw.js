var CACHE_NAME = 'spare-parts-v7';
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
  var url = event.request.url;
  // API calls (to the Apps Script web app) carry the PIN in the URL and
  // return live, one-time results — never cache these, and never serve
  // a stale cached one back on failure. Pass straight through to the
  // network every time.
  if (url.indexOf('script.google.com') !== -1 || url.indexOf('?action=') !== -1) {
    event.respondWith(fetch(event.request.clone()));
    return;
  }
  // Everything else (the app shell itself) — network first — always get
  // the latest version. Only fall back to cache if offline.
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
