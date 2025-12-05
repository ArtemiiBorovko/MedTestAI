// ========== КОНФИГУРАЦИЯ ==========
const CACHE_NAME = "medical-test-v" + Date.now(); // Уникальное имя
const OFFLINE_URL = "/index.html";

// Статические ресурсы для предварительного кэширования
const PRE_CACHE = [
  "/",
  "/index.html",
  "/manifest.json",
  "/favicon.ico",
  "/favicon.svg",
  "/icon-192.png",
  "/icon-512.png",
];

// ========== УСТАНОВКА ==========
self.addEventListener("install", (event) => {
  console.log("[SW] Установка");

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("[SW] Кэшируем основные файлы");
        return cache.addAll(PRE_CACHE);
      })
      .then(() => {
        console.log("[SW] Предварительное кэширование завершено");
        return self.skipWaiting();
      }),
  );
});

// ========== АКТИВАЦИЯ ==========
self.addEventListener("activate", (event) => {
  console.log("[SW] Активация");

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log("[SW] Удаляем старый кэш:", cacheName);
              return caches.delete(cacheName);
            }
          }),
        );
      })
      .then(() => self.clients.claim()),
  );
});

// ========== ОБРАБОТКА ЗАПРОСОВ ==========
self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // 1. Пропускаем не-GET и API запросы
  if (request.method !== "GET" || url.pathname.startsWith("/api/")) {
    return;
  }

  // 2. Для навигации - особый подход
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match(OFFLINE_URL)));
    return;
  }

  // 3. Для всех остальных ресурсов
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      // Если есть в кэше - возвращаем сразу (быстро!)
      if (cachedResponse) {
        return cachedResponse;
      }

      // Если нет в кэше - загружаем из сети
      return fetch(request)
        .then((response) => {
          // Важно: кэшируем только успешные ответы
          if (response.ok) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache).catch(() => {});
              console.log("[SW] Закэшировано:", request.url);
            });
          }
          return response;
        })
        .catch((error) => {
          console.warn("[SW] Ошибка загрузки:", request.url, error);
          // Для изображений - возвращаем заглушку
          if (request.destination === "image") {
            return caches.match("/icon-192.png");
          }
          return new Response("", { status: 503 });
        });
    }),
  );
});
