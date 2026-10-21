/* Cache only the app's static files. Questionnaire responses remain in local storage. */
const CACHE = 'heck-shell-v2';
const FILES = ['/', '/index.html', '/style.css', '/schema.js', '/app.js', '/offline.js', '/manifest.webmanifest', '/assets/icon.svg', '/assets/emblema.png', '/assets/questionario.pdf'];
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await Promise.all(FILES.map(async path => {
      const response = await fetch(new Request(path, {cache:'reload', credentials:'same-origin', redirect:'error'}));
      if (!response.ok || (path.endsWith('.js') && !/javascript/.test(response.headers.get('content-type') || ''))) throw new Error('Offline file unavailable: ' + path);
      await cache.put(path, response);
    }));
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith('heck-shell-') && name !== CACHE).map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});
self.addEventListener('message', event => {
  if (event.data?.type === 'ACTIVATE_UPDATE') self.skipWaiting();
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;
  // Leave sign-in, API routes and all other URLs to the network.
  if (!FILES.includes(url.pathname)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const response = await cache.match(url.pathname);
    if (response) return response;
    return fetch(event.request);
  })());
});
