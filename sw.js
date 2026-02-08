const CACHE_NAME = 'sabji-khata-cache-v9';
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './assets/global.css',
  './assets/components.js',
  './assets/supabase-config.js',
  './assets/license-check.js',
  './assets/icon-192x192.png',
  './assets/icon-512x512.png',
  './assets/apple-touch-icon.png',
  './assets/favicon.ico'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
