// ========== КОНФИГУРАЦИЯ ==========
const CACHE_NAME = "medical-test-v9"; // ИЗМЕНИЛИ версию!
const OFFLINE_URL = "/index.html";

// Статические ресурсы, которые кэшируем сразу
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/favicon.svg",
  "/icon-192.png",
  "/icon-512.png",
];

// Динамически добавляем пути к скриптам и стилям из сборки
const DYNAMIC_ASSETS = [
  "/assets/index-oaE3STx0.js",    // Ваш текущий JS файл
  "/assets/index-RyikI7SK.css",   // Ваш текущий CSS файл
  "/assets/logo-j5tK37CS.png",    // Ваш логотип
];

// Список всех картинок вопросов (54 картинки)
const PHOTO_NUMBERS = [
  53, 138, 143, 275, 278, 280, 281, 318, 319, 321, 382, 386, 387, 474, 482, 502,
  508, 584, 627, 628, 684, 689, 752, 753, 825, 850, 851, 914, 964, 965, 978,
  1093, 1164, 1173, 1256, 1408, 1447, 1448, 1492, 1521, 1551, 1575, 1678, 1679,
  1732, 1764, 1781, 2048, 2071, 2092, 2125, 2175, 2180, 2184, 2206, 2212,
];

// Функция для получения всех путей к ресурсам
function getAllAssets() {
  const allAssets = [...STATIC_ASSETS, ...DYNAMIC_ASSETS];

  // Добавляем все картинки
  PHOTO_NUMBERS.forEach((num) => {
    allAssets.push(`/images/${num}.png`);
  });

  return allAssets;
}

// ========== INSTALL (УСТАНОВКА) ==========
self.addEventListener("install", (event) => {
  console.log("🚀 Service Worker: Установка v9");

  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      const assetsToCache = getAllAssets();
      console.log(`📦 Кэшируем ${assetsToCache.length} файлов`);

      // Кэшируем с обработкой ошибок для каждого файла
      for (const url of assetsToCache) {
        try {
          await cache.add(url);
        } catch (err) {
          console.warn(`⚠️ Не удалось кэшировать ${url}:`, err.message);
        }
      }
      console.log("✅ Все файлы закэшированы");
    })
  );

  // Активируем SW сразу
  self.skipWaiting();
});

// ========== ACTIVATE (АКТИВАЦИЯ) ==========
self.addEventListener("activate", (event) => {
  console.log("🔓 Service Worker: Активация v9");

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Удаляем все старые кэши
          if (cacheName !== CACHE_NAME) {
            console.log(`🧹 Удаляю старый кэш: ${cacheName}`);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log("✅ Все старые кэши удалены");
      // Берём контроль над всеми вкладками сразу
      return self.clients.claim();
    })
  );
});

// ========== FETCH (ЗАПРОСЫ) ==========
self.addEventListener("fetch", (event) => {
  // Игнорируем неподдерживаемые запросы
  if (
    event.request.url.startsWith("chrome-extension://") ||
    event.request.url.includes("sockjs-node") ||
    event.request.method !== "GET"
  ) {
    return;
  }

  // ОСОБАЯ ОБРАБОТКА ДЛЯ iOS: навигационные запросы
  if (event.request.mode === "navigate") {
    console.log("🌐 Навигационный запрос:", event.request.url);

    event.respondWith(
      fetch(event.request)
        .catch(async () => {
          // Если оффлайн - возвращаем закэшированный index.html
          const cache = await caches.open(CACHE_NAME);
          const cached = await cache.match(OFFLINE_URL);
          if (cached) {
            console.log("📱 Оффлайн режим: загружаем из кэша");
            return cached;
          }
          // Если даже кэша нет - пробуем network fallback
          return fetch(event.request);
        })
    );
    return;
  }

  // Для всех остальных запросов: Сначала кэш, потом сеть
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // Если есть в кэше - возвращаем
        if (cachedResponse) {
          console.log("💾 Из кэша:", event.request.url);
          return cachedResponse;
        }

        // Если нет в кэше - загружаем из сети
        console.log("🌐 Из сети:", event.request.url);
        return fetch(event.request)
          .then((response) => {
            // Клонируем ответ, т.к. он может использоваться только один раз
            const responseToCache = response.clone();

            // Кэшируем только успешные ответы
            if (response && response.status === 200 && response.type === "basic") {
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                  console.log("➕ Добавлено в кэш:", event.request.url);
                });
            }

            return response;
          })
          .catch((error) => {
            console.error("❌ Ошибка загрузки:", event.request.url, error);
            // Для API запросов возвращаем ошибку, для ресурсов - ничего
            if (event.request.url.includes("/api/")) {
              return new Response(JSON.stringify({ 
                error: "Нет соединения с интернетом" 
              }), {
                status: 503,
                headers: { "Content-Type": "application/json" }
              });
            }
            return new Response("", { status: 503 });
          });
      })
  );
});

// ========== PUSH NOTIFICATIONS ==========
self.addEventListener("push", function (event) {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body || "Время позаниматься!",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: "1",
    },
    actions: [
      {
        action: "open",
        title: "Открыть приложение",
      },
      {
        action: "close",
        title: "Закрыть",
      },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || "Medical Test AI", options),
  );
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  if (event.action === "open") {
    event.waitUntil(
      clients.matchAll({ type: "window" }).then((windowClients) => {
        for (let client of windowClients) {
          if (client.url.includes(self.registration.scope) && "focus" in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow("/");
        }
      }),
    );
  }
});

// ========== ОБРАБОТКА СООБЩЕНИЙ ИЗ ПРИЛОЖЕНИЯ ==========
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SHOW_NOTIFICATION") {
    const { title, body } = event.data;
    event.waitUntil(
      self.registration.showNotification(title, {
        body: body,
        icon: "/icon-192.png",
        badge: "/icon-192.png",
        vibrate: [200, 100, 200],
        tag: "daily-reminder",
        requireInteraction: true,
      }),
    );
  }

  // Запрос на обновление кэша
  if (event.data && event.data.type === "UPDATE_CACHE") {
    console.log("🔄 Запрос на обновление кэша");
    self.skipWaiting();
  }
});

// ========== ПЕРИОДИЧЕСКАЯ СИНХРОНИЗАЦИЯ (для фоновых задач) ==========
self.addEventListener("periodicsync", (event) => {
  if (event.tag === "update-cache") {
    console.log("🔄 Периодическая синхронизация кэша");
    event.waitUntil(updateCache());
  }
});

async function updateCache() {
  const cache = await caches.open(CACHE_NAME);
  // Можно добавить логику обновления кэша
}