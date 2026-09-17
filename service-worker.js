// Кунлик Хисобот — Service Worker
// Offline ишлаш ва PWA сифатида ўрнатиш учун
// v2: HTML доим тармоқдан олинади — GitHub'га қўйилган янгиланиш дарҳол кўринади.
//     Расм/manifest каби ўзгармас файллар эса кэшдан (тезроқ, интернет тежайди).

const CACHE_NAME = "kunlik-hisobot-v2";
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

// ---- Сўровларни ушлаш ----
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // Бошқа доменлар (Firebase, фонтлар) — кэшламаймиз, тўғридан-тўғри тармоқдан
  if (url.origin !== self.location.origin) return;

  const isHTML =
    event.request.mode === "navigate" ||
    url.pathname.endsWith(".html") ||
    url.pathname.endsWith("/");

  if (isHTML) {
    // HTML учун: аввал тармоқ (энг янги нусха), интернет йўқ бўлса — кэшдан
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() =>
          caches.match(event.request).then((cached) => cached || caches.match("./index.html"))
        )
    );
    return;
  }

  // Расм, manifest каби статик файллар учун: аввал кэш (тезроқ)
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});
