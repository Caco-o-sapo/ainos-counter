const CACHE_NAME = "ainos-watch-shell-v1";
const SHELL_FILES = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/icon.svg",
  "/notas.js",
  "/notas-store.js",
  "/interacoes.js",
  "/jogo.js",
  "/supabase-config.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(SHELL_FILES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith("ainos-watch-") && key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;

  event.respondWith(
    fetch(request).then((response) => {
      if (response.ok) {
        const copia = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copia));
      }
      return response;
    }).catch(async () => {
      const cached = await caches.match(request);
      if (cached) return cached;
      if (request.mode === "navigate") {
        return (await caches.match("/index.html")) || Response.error();
      }
      return Response.error();
    })
  );
});
