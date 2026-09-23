const CACHE = 'votabrasil-v36';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon.svg',
  './logo.svg'
];

// Install event with cache handling
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => {
      return Promise.allSettled(
        ASSETS.map(url => c.add(url).catch(err => console.warn('[SW] Falha ao cachear asset:', url, err)))
      );
    })
  );
  self.skipWaiting();
});

// Activate event - clear old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => 
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch event with fallback
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  
  e.respondWith(
    caches.match(e.request).then(response => {
      if (response) {
        return response;
      }
      return fetch(e.request).then(response => {
        const copy = response.clone();
        caches.open(CACHE).then(c => {
          c.put(e.request, copy);
        });
        return response;
      }).catch(() => {
        // Fallback for offline
        if (e.request.url.endsWith('.html')) {
          return caches.match('./index.html');
        }
        return new Response('Recurso não disponível offline', { 
          status: 404, 
          statusText: 'Not Found' 
        });
      });
    })
  );
});
