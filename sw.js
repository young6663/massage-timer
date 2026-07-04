/* ?閮????Ｙ?敹怠? Service Worker
   摰????券瑼?摮脫?璈翰??銋???銝敺?霈敹怠?嚗??其?靘陷蝬脰楝??   ?湔??? VERSION ??1嚗蝙?刻????????拇活?喳?踹?啁???*/

const VERSION = 'massage-timer-v5';
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

/* 敹怠??芸?嚗蝺??賡?嚗?蝬脰楝???舀?啣翰??*/
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
