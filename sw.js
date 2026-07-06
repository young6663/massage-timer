/* 離線快取 Service Worker
   安裝後所有檔案存在本機快取，之後開啟不需網路也能用。
   更新方式：VERSION 加 1，使用者下次開啟會自動抓新版並清掉舊快取。 */

const VERSION = 'massage-timer-v15';
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

/* 快取優先，背景同步更新：離線可用，有網路時自動抓新版 */
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
