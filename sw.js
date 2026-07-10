// Service Worker — GPC HDSR
// Compatible con GitHub Pages (subcarpeta) y dominio raíz
const CACHE_NAME = 'gpc-hdsr-v2';

// Detectar el scope automáticamente (funciona con /repo/ o con /)
const BASE = self.registration.scope;

const STATIC_ASSETS = [
  BASE + 'index.html',
  BASE + 'manifest.json',
  BASE + 'icons/icon-192x192.png',
  BASE + 'icons/icon-512x512.png',
  'https://fonts.googleapis.com/css2?family=Source+Serif+4:opsz,wght@8..60,500;8..60,600;8..60,700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@500;600&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = e.request.url;

  // Firebase y Cloudinary: siempre red (datos en tiempo real)
  if (url.includes('firestore.googleapis.com') ||
      url.includes('googleapis.com') ||
      url.includes('firebase') ||
      url.includes('cloudinary.com') ||
      url.includes('res.cloudinary') ||
      url.includes('gstatic.com/firebasejs')) {
    return;
  }

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(response => {
        if (!response || response.status !== 200 || response.type === 'opaque') return response;
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        return response;
      }).catch(() => caches.match(BASE + 'index.html'));
    })
  );
});
