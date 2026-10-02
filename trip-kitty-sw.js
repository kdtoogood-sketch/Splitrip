// Trip Kitty service worker: caches only Trip Kitty's own files so the app
// opens without signal. Every other request (Firebase, fonts, your other apps)
// goes straight to the network untouched.
const CACHE = 'trip-kitty-v1';
const FILES = ['trip-kitty.html', 'trip-kitty.webmanifest', 'trip-kitty-192.png', 'trip-kitty-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith('trip-kitty-') && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  const name = url.pathname.split('/').pop();
  if (!FILES.includes(name)) return;
  // Network first so updates you upload show up; fall back to the cached copy offline.
  e.respondWith(
    fetch(e.request).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
      return res;
    }).catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
