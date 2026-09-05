// Кунлик Хисобот — Service Worker
// Offline ишлаш ва PWA сифатида ўрнатиш учун

const CACHE_NAME = "kunlik-hisobot-v1";
const APP_SHELL = [
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

// ---- Ўрнатиш: асосий файлларни кэшлаш ----
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

// ---- Фаоллаштириш: эски кэшларни тозалаш ----
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    )
  );
  self.clients.claim();
});

// ---- Сўровларни ушлаш: аввал кэш, бўлмаса тармоқ ----
self.addEventListener("fetch", (event) => {
  // Фақат GET сўровлар учун
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request)
        .then((response) => {
          // Муваффақиятли жавобни кэшга сақлаш (масалан, фонтлар)
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => {
          // Интернет йўқ ва кэшда ҳам топилмади — асосий саҳифани қайтариш
          if (event.request.mode === "navigate") {
            return caches.match("./index.html");
          }
        });
    })
  );
});
