/* Offline-first Service Worker (precache everything) */
const CACHE_NAME = 'pwa-exam-v1';
const PRECACHE_URLS = [
  "./",
  "./404.html",
  "./app.js",
  "./assets/img_001.png",
  "./assets/img_002.png",
  "./assets/img_003.png",
  "./assets/img_004.png",
  "./assets/img_005.png",
  "./assets/img_006.png",
  "./assets/img_007.png",
  "./assets/img_008.png",
  "./assets/img_009.png",
  "./assets/img_010.png",
  "./assets/img_011.png",
  "./assets/img_012.png",
  "./assets/img_013.png",
  "./assets/img_014.png",
  "./assets/img_015.png",
  "./assets/img_016.png",
  "./assets/img_017.png",
  "./assets/img_018.png",
  "./assets/img_019.png",
  "./assets/img_020.png",
  "./assets/img_021.png",
  "./assets/img_022.png",
  "./assets/img_023.png",
  "./assets/img_024.png",
  "./assets/img_025.png",
  "./assets/img_026.png",
  "./assets/img_027.png",
  "./assets/img_028.png",
  "./assets/img_029.png",
  "./assets/img_030.png",
  "./assets/img_031.png",
  "./assets/img_032.png",
  "./assets/img_033.png",
  "./assets/img_034.png",
  "./assets/img_035.png",
  "./assets/img_036.png",
  "./assets/img_037.png",
  "./assets/img_038.png",
  "./assets/img_039.png",
  "./assets/img_040.png",
  "./assets/img_041.png",
  "./assets/img_042.png",
  "./assets/img_043.png",
  "./assets/img_044.png",
  "./assets/img_045.png",
  "./assets/img_046.png",
  "./assets/img_047.png",
  "./assets/img_048.png",
  "./assets/img_049.png",
  "./assets/img_050.png",
  "./assets/img_051.png",
  "./assets/img_052.png",
  "./assets/img_053.png",
  "./assets/img_054.png",
  "./assets/img_055.png",
  "./assets/img_056.png",
  "./assets/img_057.png",
  "./assets/img_058.png",
  "./assets/img_059.png",
  "./assets/img_060.png",
  "./assets/img_061.png",
  "./assets/img_062.png",
  "./assets/img_063.png",
  "./assets/img_064.png",
  "./assets/img_065.png",
  "./assets/img_066.png",
  "./assets/img_067.png",
  "./assets/img_068.png",
  "./assets/img_069.png",
  "./assets/img_070.png",
  "./assets/img_071.png",
  "./assets/img_072.png",
  "./assets/img_073.png",
  "./assets/img_074.png",
  "./assets/img_075.png",
  "./assets/img_076.png",
  "./assets/img_077.png",
  "./assets/img_078.png",
  "./assets/img_079.png",
  "./assets/img_080.png",
  "./assets/img_081.png",
  "./assets/img_082.png",
  "./assets/img_083.png",
  "./assets/img_084.png",
  "./assets/img_085.png",
  "./assets/img_086.png",
  "./assets/img_087.png",
  "./assets/img_088.png",
  "./assets/img_089.png",
  "./assets/img_090.png",
  "./assets/img_091.png",
  "./assets/img_092.png",
  "./assets/img_093.png",
  "./assets/img_094.png",
  "./assets/img_095.png",
  "./assets/img_096.png",
  "./assets/img_097.png",
  "./assets/img_098.png",
  "./assets/img_099.png",
  "./assets/img_100.png",
  "./assets/img_101.png",
  "./assets/img_102.png",
  "./assets/img_103.png",
  "./assets/img_104.png",
  "./content/q001.html",
  "./content/q002.html",
  "./content/q003.html",
  "./content/q004.html",
  "./content/q005.html",
  "./content/q006.html",
  "./content/q007.html",
  "./content/q008.html",
  "./content/q009.html",
  "./content/q010.html",
  "./content/q011.html",
  "./content/q012.html",
  "./content/q013.html",
  "./content/q014.html",
  "./content/q015.html",
  "./content/q016.html",
  "./content/q017.html",
  "./content/q018.html",
  "./content/q019.html",
  "./content/q020.html",
  "./content/q021.html",
  "./content/q022.html",
  "./content/q023.html",
  "./content/q024.html",
  "./content/q025.html",
  "./content/q026.html",
  "./content/q027.html",
  "./content/q028.html",
  "./content/q029.html",
  "./content/q030.html",
  "./content/q031.html",
  "./content/q032.html",
  "./content/q033.html",
  "./content/q034.html",
  "./content/q035.html",
  "./content/q036.html",
  "./content/q037.html",
  "./content/q038.html",
  "./content/q039.html",
  "./content/q040.html",
  "./content/q041.html",
  "./content/q042.html",
  "./content/q043.html",
  "./content/q044.html",
  "./content/q045.html",
  "./content/q046.html",
  "./content/q047.html",
  "./content/q048.html",
  "./content/q049.html",
  "./content/q050.html",
  "./content/q051.html",
  "./content/q052.html",
  "./content/q053.html",
  "./content/q054.html",
  "./content/q055.html",
  "./content/q056.html",
  "./content/q057.html",
  "./content/q058.html",
  "./content/q059.html",
  "./content/q060.html",
  "./content/q061.html",
  "./data/questions.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./index.html",
  "./manifest.json",
  "./styles.css"
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => (k !== CACHE_NAME) ? caches.delete(k) : Promise.resolve()));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // App shell for navigation requests
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match('./index.html');
      if (cached) return cached;
      try {
        return await fetch(req);
      } catch (e) {
        return cached || Response.error();
      }
    })());
    return;
  }

  // Cache-first for same-origin assets; network fallback (and cache update)
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(req, {ignoreSearch: true});
    if (cached) return cached;
    try {
      const fresh = await fetch(req);
      if (req.method === 'GET' && fresh && fresh.status === 200 && new URL(req.url).origin === self.location.origin) {
        cache.put(req, fresh.clone());
      }
      return fresh;
    } catch (e) {
      return cached || Response.error();
    }
  })());
});
