const CACHE_NAME = "medical-test-basic";
self.addEventListener("install", (e) => e.waitUntil(caches.open(CACHE_NAME)));
self.addEventListener("fetch", (e) => {});
