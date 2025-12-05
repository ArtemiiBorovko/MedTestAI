// ========== КОНФИГУРАЦИЯ ==========
const CACHE_NAME = "medical-test-full-cache-v1";
const OFFLINE_URL = "/index.html";

// 1. Ядро приложения (файлы БЕЗ хэшей)
const CORE_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/favicon.ico",
  "/favicon.svg",
  "/icon-192.png",
  "/icon-512.png",
  "/sw.js",
];

// 2. ВСЕ картинки вопросов (56 штук) - имена НЕ меняются!
const QUESTION_IMAGES = Array.from(
  { length: 56 },
  (_, i) =>
    `/images/${[53, 138, 143, 275, 278, 280, 281, 318, 319, 321, 382, 386, 387, 474, 482, 502, 508, 584, 627, 628, 684, 689, 752, 753, 825, 850, 851, 914, 964, 965, 978, 1093, 1164, 1173, 1256, 1408, 1447, 1448, 1492, 1521, 1551, 1575, 1678, 1679, 1732, 1764, 1781, 2048, 2071, 2092, 2125, 2175, 2180, 2184, 2206, 2212][i]}.png`,
);

// 3. Все ресурсы для предварительного кэширования
const ALL_ASSETS = [...CORE_ASSETS, ...QUESTION_IMAGES];

// ========== УСТАНОВКА ==========
self.addEventListener("install", (event) => {
  console.log("[SW] Установка: кэшируем ВСЕ ресурсы приложения");

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log(`[SW] Кэшируем ${ALL_ASSETS.length} файлов...`);

        // Пытаемся кэшировать всё, но не падаем при ошибках
        return Promise.allSettled(
          ALL_ASSETS.map((url) =>
            cache
              .add(url)
              .catch((err) =>
                console.warn(`[SW] Не удалось кэшировать ${url}:`, err.message),
              ),
          ),
        );
      })
      .then(() => {
        console.log("[SW] Все ресурсы закэшированы (или попытка завершена)");
        return self.skipWaiting();
      }),
  );
});

// ========== АКТИВАЦИЯ ==========
self.addEventListener("activate", (event) => {
  console.log("[SW] Активация новой версии");

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

  // Пропускаем не-GET и API запросы
  if (request.method !== "GET" || url.pathname.startsWith("/api/")) return;

  // Для навигации
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match(OFFLINE_URL)));
    return;
  }

  // ОСОБАЯ ЛОГИКА ДЛЯ /assets/ файлов (JS/CSS с хэшами)
  if (url.pathname.startsWith("/assets/")) {
    event.respondWith(
      caches.match(request).then((cached) => {
        // Если есть в кэше - отдаём
        if (cached) return cached;

        // Если нет - грузим из сети и кэшируем на будущее
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      }),
    );
    return;
  }

  // Для всех остальных ресурсов (картинки, шрифты и т.д.)
  event.respondWith(
    caches.match(request).then((cached) => {
      return (
        cached ||
        fetch(request)
          .then((response) => {
            // Кэшируем успешные ответы для будущего использования
            if (response.ok) {
              const clone = response.clone();
              caches
                .open(CACHE_NAME)
                .then((cache) => cache.put(request, clone));
            }
            return response;
          })
          .catch(() => {
            // Для изображений - заглушка
            if (request.destination === "image") {
              return caches.match("/icon-192.png");
            }
            return new Response("Оффлайн", { status: 503 });
          })
      );
    }),
  );
});
