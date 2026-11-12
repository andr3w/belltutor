// Offline cache, so the page keeps working in a tower with no signal once it has been
// opened. The page itself is fetched from the network first, so an update is picked up
// as soon as there is a connection; everything it loads is stamped with ?v=, so those
// can be served from the cache without ever going stale.
const CACHE = 'bobdoubles-1';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(Promise.all([
  self.clients.claim(),
  caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
])));

self.addEventListener('fetch', e => {
  if (new URL(e.request.url).origin !== self.location.origin) return;
  e.respondWith(e.request.mode === 'navigate'
    ? fetch(e.request).then(r => keep(e.request, r)).catch(() => caches.match(e.request).then(r => r || caches.match('/')))
    : caches.match(e.request).then(r => r || fetch(e.request).then(res => keep(e.request, res))));
});

function keep(request, response) {
  if (response.ok) caches.open(CACHE).then(c => c.put(request, response.clone()));
  return response;
}
