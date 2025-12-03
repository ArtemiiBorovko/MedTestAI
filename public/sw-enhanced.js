// public/sw-enhanced.js
const CACHE_NAME = "medical-test-v5";
const urlsToCache = [
  "/",
  "/index.html",
  "/static/js/bundle.js",
  "/static/css/main.css",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
];

// Установка Service Worker
self.addEventListener("install", (event) => {
  console.log("Service Worker: установлен");
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("Кэширование файлов");
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting()),
  );
});

// Активация Service Worker
self.addEventListener("activate", (event) => {
  console.log("Service Worker: активирован");
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cache) => {
            if (cache !== CACHE_NAME) {
              console.log("Удаляем старый кэш:", cache);
              return caches.delete(cache);
            }
          }),
        );
      })
      .then(() => self.clients.claim()),
  );
});

// Обработка fetch событий
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Возвращаем кэшированную версию или делаем запрос
      return response || fetch(event.request);
    }),
  );
});

// Обработка push уведомлений
self.addEventListener("push", (event) => {
  console.log("Push событие получено:", event);

  let data = {};
  if (event.data) {
    data = event.data.json();
  }

  const options = {
    body: data.body || "Не забудьте пройти тесты для повторения материала.",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: "2",
    },
    actions: [
      {
        action: "explore",
        title: "Открыть приложение",
        icon: "/icon-192.png",
      },
      {
        action: "close",
        title: "Закрыть",
        icon: "/icon-192.png",
      },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(
      data.title || "Medical Test - Время заниматься!",
      options,
    ),
  );
});

// Обработка кликов по уведомлениям
self.addEventListener("notificationclick", (event) => {
  console.log("Уведомление кликнуто:", event.notification.tag);
  event.notification.close();

  if (event.action === "close") {
    return;
  }

  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes("/") && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow("/");
      }
    }),
  );
});

// Фоновая синхронизация для напоминаний
self.addEventListener("sync", (event) => {
  if (event.tag === "reminder-sync") {
    console.log("Фоновая синхронизация для напоминаний");
    event.waitUntil(doReminderCheck());
  }
});

async function doReminderCheck() {
  // Здесь можно добавить логику проверки напоминаний в фоне
  console.log("Проверка напоминаний в фоне");
}
