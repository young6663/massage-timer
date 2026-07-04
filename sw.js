/* 按摩計時器 離線快取 Service Worker
   安裝時把全部檔案存進手機快取，之後開啟一律先讀快取，完全不依賴網路。
   更新版本時把 VERSION 加 1，使用者連線狀態下重開兩次即可拿到新版。 */

const VERSION = 'massage-timer-v1';
const FILES = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(VERSION).then((c) => c.addAll(FILES)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

/* 快取優先：離線也能開；有網路時背景更新快取 */
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((hit) => {
      const fetchAndUpdate = fetch(e.request).then((res) => {
        if (res && res.ok && e.request.method === 'GET') {
          const clone = res.clone();
          caches.open(VERSION).then((c) => c.put(e.request, clone));
        }
        return res;
      }).catch(() => hit);
      return hit || fetchAndUpdate;
    })
  );
});
