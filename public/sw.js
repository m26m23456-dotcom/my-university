const CACHE = 'my-university-v3'
// ملفات (مواد/تبليغات/مهمات) حفظها المستخدم يدوياً "للعرض بدون نت" — راجع
// components/save-offline-button.tsx حيث يُكتب إليها مباشرة من الصفحة.
const FILES_CACHE = 'offline-files'
const KEEP_CACHES = [CACHE, FILES_CACHE]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(['/logo.png']))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => !KEEP_CACHES.includes(k)).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)

  if (url.pathname.startsWith('/api/files/')) {
    // نفضّل الشبكة دوماً حتى تبقى الملفات محدّثة ويعمل التمرير (Range) أثناء
    // تشغيل الفيديو بشكل طبيعي، ونرجع للنسخة المحفوظة محلياً فقط عند تعذّر
    // الوصول للشبكة (بدون نت) — وفقط للملفات التي ضغط المستخدم "حفظ" عليها.
    event.respondWith(
      fetch(req).catch(async () => {
        const cache = await caches.open(FILES_CACHE)
        const cached = await cache.match(url.origin + url.pathname)
        if (cached) return cached
        return Response.error()
      }),
    )
    return
  }
  // لا نعترض طلبات فتح الصفحات أو أي طلب آخر — نترك المتصفح يتولى الشبكة وإعادة
  // المحاولة تلقائيًا، وهذا أوثق من أي منطق نكتبه هنا.
})

self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch {
    data = { title: 'My university', body: event.data ? event.data.text() : '' }
  }
  event.waitUntil(
    self.registration.showNotification(data.title || 'My university', {
      body: data.body || '',
      icon: '/logo.png',
      badge: '/logo.png',
      dir: 'rtl',
      lang: 'ar',
      tag: data.tag,
      renotify: true,
      data: { url: data.url || '/' },
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = (event.notification.data && event.notification.data.url) || '/'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      return self.clients.openWindow(url)
    }),
  )
})
