/* Gehirnjogging – Offline-Betrieb. Beim Ändern von Dateien die Version hochzählen. */
var CACHE = "gehirnjogging-v2";
var DATEIEN = [
  "./",
  "./index.html",
  "./ueber.html",
  "./manifest.json",
  "./icon.svg",
  "./icon-maskable.svg",
  "./css/common.css",
  "./js/common.js",
  "./js/uebungen.js",
  "./uebungen/weitblick.html",
  "./uebungen/doppelspur.html",
  "./uebungen/regelwechsel.html",
  "./uebungen/bremse.html",
  "./uebungen/stadtplan.html",
  "./uebungen/merkzettel.html",
  "./uebungen/gehoer.html",
  "./uebungen/marktstand.html"
];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) { return c.addAll(DATEIEN); }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (namen) {
      return Promise.all(namen.map(function (n) { return n === CACHE ? null : caches.delete(n); }));
    }).then(function () { return self.clients.claim(); })
  );
});

/* Erst das Netz fragen, dann den Cache: online gibt es immer die neueste Fassung,
   ohne Verbindung greift die gespeicherte. */
self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET") return;
  e.respondWith(
    fetch(e.request).then(function (antwort) {
      var kopie = antwort.clone();
      caches.open(CACHE).then(function (c) { c.put(e.request, kopie); }).catch(function () {});
      return antwort;
    }).catch(function () {
      return caches.match(e.request).then(function (treffer) {
        return treffer || caches.match("./index.html");
      });
    })
  );
});
