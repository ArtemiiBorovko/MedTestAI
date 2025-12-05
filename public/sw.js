// ========== КОНФИГУРАЦИЯ ==========
const CACHE_NAME = "medical-test-final-" + Date.now(); // УНИКАЛЬНОЕ имя
const OFFLINE_URL = "/index.html";

// ========== УСТАНОВКА ==========
self.addEventListener("install", (event) => {
  console.log("[SW] Установка");

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("[SW] Кэшируем ядро приложения");
        return cache.addAll([
          "/",
          "/index.html",
          "/manifest.json",
          "/favicon.ico",
          "/favicon.svg",
          "/icon-192.png",
          "/icon-512.png",
        ]);
      })
      .then(() => self.skipWaiting()), // Немедленная активация
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

  // Пропускаем не-GET запросы и chrome-extension
  if (
    request.method !== "GET" ||
    request.url.startsWith("chrome-extension://")
  ) {
    return;
  }

  // Для навигации
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match(OFFLINE_URL)));
    return;
  }

  // Для всех остальных: сеть -> кэш
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Если ответ успешен - кэшируем его
        if (response.ok) {
          const clone = response.clone();
          caches
            .open(CACHE_NAME)
            .then((cache) => cache.put(request, clone))
            .catch((e) => console.warn("[SW] Ошибка кэширования:", e));
        }
        return response;
      })
      .catch(async () => {
        // Если сети нет - ищем в кэше
        const cached = await caches.match(request);
        if (cached) return cached;

        // Для изображений - заглушка
        if (request.destination === "image") {
          return caches.match("/icon-192.png");
        }

        return new Response("Оффлайн", { status: 503 });
      }),
  );
});
