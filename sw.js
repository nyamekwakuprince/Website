'use strict';

const CACHE_NAME = 'lara-luxestudio-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './services.html',
  './gallery.html',
  './contact.html',
  './booking.html',
  './admin/index.html',
  './assets/css/styles.css',
  './assets/js/main.js',
  './assets/js/admin.js',
  './assets/images/logo.png',
  './assets/images/hero_bg.png',
  './assets/images/installation_1.jfif',
  './assets/images/installation_2.jfif',
  './assets/images/installation_3.jfif',
  './assets/images/installation_4.jfif',
  './assets/images/curling_1.jfif',
  './assets/images/curling_2.jfif',
  './assets/images/curling_3.jfif',
  './assets/images/curling_4.jfif',
  './assets/images/revamping_1.jfif',
  './assets/images/revamping_2.jfif',
  './assets/images/revamping_3.jfif',
  './assets/images/revamping_4.jfif',
  './assets/images/braid_1.jfif',
  './assets/images/braid_2.jfif',
  './assets/images/braid_3.jfif',
  './assets/images/braid_4.jfif',
  './assets/images/service_straightening.png',
  './assets/fonts/Inter-300.ttf',
  './assets/fonts/Inter-400.ttf',
  './assets/fonts/Inter-500.ttf',
  './assets/fonts/Inter-600.ttf',
  './assets/fonts/PlayfairDisplay-Italic-400.ttf',
  './assets/fonts/PlayfairDisplay-Normal-400.ttf',
  './assets/fonts/PlayfairDisplay-Normal-600.ttf',
  './assets/fonts/PlayfairDisplay-Normal-700.ttf'
];

// Install Event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching offline assets');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate Event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Clearing old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event
self.addEventListener('fetch', (event) => {
  // Only handle GET requests and local requests
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      }).catch(() => {
        // Fallback for document navigation when offline
        if (event.request.headers.get('accept').includes('text/html')) {
          return caches.match('./index.html');
        }
      });
    })
  );
});
