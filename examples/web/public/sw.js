const CACHE_NAME = "golden-path-v__APP_VERSION__";
const PRECACHE = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon.svg",
  "./favicon.svg",
  "./logo.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  // Device catalog changes often during enrichment — never serve a stale copy.
  const isDevicesJson = url.pathname.endsWith("/data/devices.json");
  event.respondWith(
    (async () => {
      if (isDevicesJson) {
        try {
          return await fetch(event.request, { cache: "no-store" });
        } catch {
          const cache = await caches.open(CACHE_NAME);
          const cached = await cache.match(event.request);
          if (cached) return cached;
          throw new Error("offline and no cache");
        }
      }
      const cache = await caches.open(CACHE_NAME);
      try {
        const response = await fetch(event.request);
        if (response.ok) {
          const copy = response.clone();
          await cache.put(event.request, copy);
        }
        return response;
      } catch {
        const cached = await cache.match(event.request);
        if (cached) return cached;
        throw new Error("offline and no cache");
      }
    })()
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
