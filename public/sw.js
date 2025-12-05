// ========== КОНФИГУРАЦИЯ ==========
const CACHE_NAME = "medical-test-full-cache-v2";
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

  // Пропускаем ожидание и активируем сразу
  self.skipWaiting();

  // Запускаем кэширование, но не блокируем установку
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log(`[SW] Кэшируем ${ALL_ASSETS.length} файлов...`);

        // Используем более надежный метод кэширования
        return Promise.allSettled(
          ALL_ASSETS.map((url) =>
            fetch(url, { mode: "no-cors" })
              .then((response) => {
                if (response.ok || response.type === "opaque") {
                  return cache.put(url, response);
                } else {
                  console.warn(
                    `[SW] Пропускаем ${url}: статус ${response.status}`,
                  );
                  return null;
                }
              })
              .catch((err) => {
                console.warn(`[SW] Ошибка при загрузке ${url}:`, err.message);
                return null;
              }),
          ),
        ).then((results) => {
          const successful = results.filter(
            (r) => r.status === "fulfilled" && r.value,
          );
          console.log(
            `[SW] Успешно закэшировано ${successful.length}/${ALL_ASSETS.length} файлов`,
          );
        });
      })
      .catch((err) => {
        console.error("[SW] Критическая ошибка при установке:", err);
      }),
  );
});

// ========== АКТИВАЦИЯ ==========
self.addEventListener("activate", (event) => {
  console.log("[SW] Активация новой версии");

  event.waitUntil(
    Promise.all([
      // Очищаем старые кэши
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log("[SW] Удаляем старый кэш:", cacheName);
              return caches.delete(cacheName);
            }
          }),
        );
      }),
      // Берём управление над всеми клиентами
      self.clients.claim(),
    ]).then(() => {
      console.log("[SW] Активация завершена");
    }),
  );
});

// ========== ОБРАБОТКА ЗАПРОСОВ ==========
self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // ИГНОРИРУЕМ неподдерживаемые схемы
  if (url.protocol === "chrome-extension:" || url.protocol === "file:") {
    return;
  }

  // Пропускаем не-GET и API запросы
  if (request.method !== "GET" || url.pathname.startsWith("/api/")) return;

  // Для навигации - всегда пытаемся загрузить свежую версию
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match(OFFLINE_URL)));
    return;
  }

  // Для остальных запросов используем стратегию "Cache First, then Network"
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      // Если есть в кэше - возвращаем
      if (cachedResponse) {
        return cachedResponse;
      }

      // Если нет в кэше - загружаем из сети
      return fetch(request)
        .then((response) => {
          // Если ответ успешен - кэшируем
          if (response.ok) {
            const clone = response.clone();
            caches
              .open(CACHE_NAME)
              .then((cache) => {
                try {
                  cache.put(request, clone);
                } catch (err) {
                  console.warn("[SW] Не удалось добавить в кэш:", err.message);
                }
              })
              .catch(() => {
                /* Игнорируем ошибки кэширования */
              });
          }
          return response;
        })
        .catch(() => {
          // Если не удалось загрузить и это картинка - возвращаем заглушку
          if (request.destination === "image") {
            return caches.match("/icon-192.png");
          }
          return new Response("Оффлайн", {
            status: 503,
            headers: { "Content-Type": "text/plain; charset=utf-8" },
          });
        });
    }),
  );
});
