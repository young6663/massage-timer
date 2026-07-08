/* 離線快取 Service Worker
   安裝後所有檔案存在本機快取，之後開啟不需網路也能用。
   更新方式：VERSION 加 1，使用者下次開啟會自動抓新版並清掉舊快取。 */

const VERSION = 'massage-timer-v27';
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

/* 點「時間到」通知 → 回到（或開啟）計時器頁面 */
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      /* 優先聚焦計時器既有的分頁（避免另開新分頁）；真的沒有才開新的 */
      const mine = list.find((c) => c.url && c.url.indexOf('massage-timer') !== -1);
      if (mine && 'focus' in mine) return mine.focus();
      for (const c of list) {
        if ('focus' in c) return c.focus();
      }
      return self.clients.openWindow('./');
    })
  );
});

/* v24 改版：頁面本體（導覽請求）改成「網路優先」——只要有網路，
   每次開啟／下拉重新整理都直接拿伺服器最新版，不再被舊快取擋掉；
   只有真的離線才退回快取。舊版是快取優先，導致 iPhone 下拉重新整理
   或直接開啟時永遠秒回舊版內容，即使伺服器早已更新（使用者實測回報：
   「下拉怎麼沒用」）。圖示等次要資源維持快取優先，減少離線時的缺圖。 */
self.addEventListener('fetch', (e) => {
  const isPage = e.request.mode === 'navigate' ||
    e.request.url.endsWith('/') || e.request.url.endsWith('index.html');

  if (isPage){
    e.respondWith(
      fetch(e.request).then((res) => {
        if (res && res.ok){
          const clone = res.clone();
          caches.open(VERSION).then((c) => c.put(e.request, clone));
        }
        return res;
      }).catch(() => caches.match(e.request))
    );
    return;
  }

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
