/* Stackline Floor PWA — service worker.
   Network-first for API, cache-first for static assets. */
const CACHE = "stackline-floor-v1";
const CORE = ["/floor-app", "/manifest.webmanifest", "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
    ).then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET") return;
  // API calls: always network (floor app queues mutations client-side)
  if (url.pathname.startsWith("/api")) return;

  // Static assets: cache-first
  if (/\.(js|css|png|jpg|svg|woff2?)$/.test(url.pathname) || url.pathname.startsWith("/icons/")) {
    e.respondWith(
      caches.match(e.request).then(
        (hit) =>
          hit ??
          fetch(e.request).then((res) => {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(e.request, copy));
            return res;
          }),
      ),
    );
    return;
  }

  // HTML navigations: network-first, fall back to cached shell
  e.respondWith(fetch(e.request).catch(() => caches.match("/floor-app")));
});
