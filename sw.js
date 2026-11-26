// network-first service worker: always fresh when online, works offline from the last visit.
const CACHE = 'uni-league-v1';
const PRE = ['./', 'index.html', 'control.html', 'css/app.css', 'manifest.webmanifest', 'data/bank.json',
  'js/main.js', 'js/core.js', 'js/store.js', 'js/data.js', 'js/ui.js', 'js/tilt.js', 'js/sfx.js', 'js/live.js', 'js/share.js', 'js/control.js',
  'js/screens/start.js', 'js/screens/home.js', 'js/screens/live-view.js', 'js/screens/sim.js', 'js/screens/heritage.js', 'js/screens/rank.js', 'js/screens/prizes.js', 'js/screens/settings.js',
  'fonts/cairo-ar.woff2', 'fonts/cairo-lt.woff2', 'fonts/kufi-ar.woff2', 'fonts/kufi-lt.woff2', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/logo.png'];

self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRE)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  const r = e.request; if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  e.respondWith(fetch(r).then((res) => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(r, copy)); } return res; }).catch(() => caches.match(r, { ignoreSearch: true })));
});
