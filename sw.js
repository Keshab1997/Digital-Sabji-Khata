const CACHE_NAME = 'digital-sabji-khata-v1';
const urlsToCache = [
  './',
  './index.html',
  './assets/global.css',
  './assets/components.js',
  './assets/supabase-config.js',
  './assets/license-check.js',
  './style.css',
  './script.js',
  './billing/index.html',
  './billing/style.css',
  './billing/script.js',
  './bill-history/index.html',
  './bill-history/style.css',
  './bill-history/script.js',
  './orders/index.html',
  './orders/style.css',
  './orders/script.js',
  './vendors/index.html',
  './vendors/style.css',
  './vendors/script.js',
  './admin/index.html',
  './admin/style.css',
  './admin/script.js',
  './login/index.html',
  './login/style.css',
  './login/script.js',
  './signup/index.html',
  './signup/style.css',
  './signup/script.js'
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
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
