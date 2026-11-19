/* global self, caches, fetch */
// The export step replaces these two tokens with the version and asset list.
const cacheName = /*__CACHE__*/ '';
const assets = /*__ASSETS__*/ [];
const known = new Set(assets);
self.addEventListener('install', event => {
  event.waitUntil(caches.open(cacheName).then(cache => cache.addAll(assets)));
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key.startsWith('family-grocery-pos-') && key !== cacheName) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  let asset = url.pathname;
  if (request.mode === 'navigate') {
    if (asset === '/') asset = '/index.html';
    if (asset === '/admin' || asset === '/admin/') asset = '/admin/index.html';
  } else if (request.headers.get('RSC') === '1' && !known.has(asset)) {
    const candidate = asset.replace(/\/?$/, '/') + 'index.txt';
    if (known.has(candidate)) asset = candidate;
  }
  if (!known.has(asset)) return;
  event.respondWith((async () => {
    const cached = await (await caches.open(cacheName)).match(asset);
    return cached || fetch(request);
  })());
});
