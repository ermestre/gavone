/* Gavone: tiene l'app nel telefono per usarla anche senza internet.
   I dati (catalogo e foto) non passano di qui: stanno in IndexedDB. */
const CACHE = "gavone-v1";
const FILES = [
  "./", "index.html", "manifest.webmanifest", "qrcode.js", "jsQR.js",
  "icona-180.png", "icona-512.png",
  "big-shoulders-display-600.woff2", "big-shoulders-display-800.woff2",
  "atkinson-hyperlegible-400.woff2", "atkinson-hyperlegible-700.woff2", "atkinson-hyperlegible-400-italic.woff2",
  "jetbrains-mono-500.woff2", "jetbrains-mono-700.woff2"
];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return; // Anthropic e il resto passano dritti
  const isPage = req.mode === "navigate";
  e.respondWith(caches.open(CACHE).then(async cache => {
    const cached = await cache.match(isPage ? "index.html" : req, { ignoreSearch: true });
    const fresh = fetch(req).then(r => { if (r.ok) cache.put(isPage ? "index.html" : req, r.clone()); return r; }).catch(() => null);
    if (cached) { e.waitUntil(fresh); return cached; }   // subito dalla memoria, aggiorna in background
    return (await fresh) || new Response("Gavone non è ancora stato scaricato: aprilo una volta con internet.", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }));
});
