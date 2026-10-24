// Service worker: the page and icons are cached for offline use; sounds and images are kept after first use.
const PAGE = "meca-page-20261024-170757";
const KEEP = "meca-keep-v1";

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(PAGE).then((c) => c.addAll(["./", "./manifest.webmanifest", "./icon-192.png"])).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith("meca-page-") && k !== PAGE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin) return;
  if (req.headers.has("range") || /\.(mp4|ppt|pdf)$/i.test(url.pathname)) return; // big files: always the network

  if (req.mode === "navigate") {
    // network first with a 12 s limit, then the cached page (works in a garage without signal)
    e.respondWith(
      Promise.race([
        fetch(req).then((r) => { const copy = r.clone(); caches.open(PAGE).then((c) => c.put("./", copy)); return r; }),
        new Promise((_, rej) => setTimeout(rej, 12000)),
      ]).catch(() => caches.match("./"))
    );
    return;
  }
  if (/\/(audio|img)\//.test(url.pathname)) {
    e.respondWith(
      caches.open(KEEP).then((c) => c.match(req).then((hit) => hit || fetch(req).then((r) => { if (r.ok) c.put(req, r.clone()); return r; })))
    );
    return;
  }
  e.respondWith(caches.match(req).then((hit) => hit || fetch(req)));
});
