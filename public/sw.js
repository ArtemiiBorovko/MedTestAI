const CACHE_NAME = "medical-test-v7";

const toCache = [
  "/",
  "/index.html",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
  "/assets/index-oaE3STx0.js",
  "/assets/index-RyikI7SK.css",
  "/assets/logo-j5tK37CS.png",
];

const photoNumbers = [
  53, 138, 143, 275, 278, 280, 281, 318, 319, 321, 382, 386, 387, 474, 482, 502,
  508, 584, 627, 628, 684, 689, 752, 753, 825, 850, 851, 914, 964, 965, 978,
  1093, 1164, 1173, 1256, 1408, 1447, 1448, 1492, 1521, 1551, 1575, 1678, 1679,
  1732, 1764, 1781, 2048, 2071, 2092, 2125, 2175, 2180, 2184, 2206, 2212,
];

// Добавляем все картинки в список
photoNumbers.forEach((num) => toCache.push(`/images/${num}.png`));

// ---------- INSTALL ----------
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      console.log("📦 Кэшируем файлы:", toCache.length, "элементов");

      // Кэшируем по одному — чтобы не упасть, если чего-то нет
      for (const url of toCache) {
        try {
          await cache.add(url);
        } catch (err) {
          console.warn("⚠️ Не удалось кэшировать:", url, err);
        }
      }
    }),
  );
  self.skipWaiting();
});

// ---------- ACTIVATE ----------
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("🧹 Удаляю старый кэш:", key);
            return caches.delete(key);
          }
        }),
      ),
    ),
  );
  self.clients.claim();
});

// ---------- FETCH ----------
self.addEventListener("fetch", (event) => {
  if (
    event.request.url.startsWith("chrome-extension://") ||
    event.request.url.includes("sockjs-node")
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request)
        .then((response) => {
          if (!response || response.status !== 200 || response.type !== "basic")
            return response;
          const clone = response.clone();
          caches
            .open(CACHE_NAME)
            .then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match("/index.html"));
    }),
  );
});

// ---------- PUSH NOTIFICATIONS ----------
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
    self.registration.showNotification(data.title || "Medical Test", options),
  );
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  if (event.action === "open") {
    event.waitUntil(
      clients.matchAll({ type: "window" }).then((windowClients) => {
        for (let client of windowClients) {
          if (client.url === self.registration.scope && "focus" in client) {
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

// ========== ДОБАВЛЯЕМ ОБРАБОТКУ НАПОМИНАНИЙ ==========

// Обработка показа уведомлений из основного приложения
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
});
