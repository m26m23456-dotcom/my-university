const CACHE = 'my-university-v3'
// ملفات (مواد/تبليغات/مهمات) حفظها المستخدم يدوياً "للعرض بدون نت" — راجع
// components/save-offline-button.tsx حيث يُكتب إليها مباشرة من الصفحة.
const FILES_CACHE = 'offline-files'
// "هيكل" التطبيق (صفحات HTML عند التنقل) — يسمح بفتح التطبيق المثبّت حتى بدون
// نت، آخذين بعين الاعتبار أنها قد تُظهر حالة تسجيل دخول قديمة للحظة لحين
// استرجاع الاتصال بالنت من جديد.
const SHELL_CACHE = 'app-shell-v1'
// أصول ثابتة (JS/CSS/خطوط/صور) من نفس الموقع — أسماؤها فريدة لكل نسخة بناء
// فالاعتماد على النسخة المخزّنة أولاً آمن تماماً.
const STATIC_CACHE = 'static-assets-v1'
const KEEP_CACHES = [CACHE, FILES_CACHE, SHELL_CACHE, STATIC_CACHE]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(['/logo.png']))
      .then(() =>
        caches
          .open(SHELL_CACHE)
          .then((cache) => cache.add('/').catch(() => {}))
          .catch(() => {}),
      )
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

  // طلبات الـ API (عدا الملفات المعالجة أدناه) تبقى متّصلة بالشبكة دوماً —
  // تحمل بيانات ومصادقة محدّثة لحظياً ولا يصح تخزينها هنا أبداً. فشل الشبكة
  // لها يبقى فشلاً طبيعياً (هذا متوقّع ومطلوب بدون نت).
  if (url.pathname.startsWith('/api/') && !url.pathname.startsWith('/api/files/')) {
    return
  }

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

  // فتح التطبيق نفسه (تنقّل بين الصفحات): نفضّل الشبكة دوماً لأنها تحمل حالة
  // تسجيل الدخول الحالية، ونحفظ كل استجابة ناجحة كـ"آخر نسخة من هيكل التطبيق"
  // ليبقى بإمكان فتح التطبيق حتى بدون نت من البداية.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone()
          caches.open(SHELL_CACHE).then((cache) => cache.put(req.url, copy))
          return res
        })
        .catch(async () => {
          const cache = await caches.open(SHELL_CACHE)
          const cached = (await cache.match(req.url)) || (await cache.match('/'))
          if (cached) return cached
          return Response.error()
        }),
    )
    return
  }

  // أصول ثابتة من نفس الموقع (JS/CSS/خطوط/صور) — أسماؤها فريدة لكل نسخة بناء،
  // فالاعتماد على النسخة المخزّنة أولاً آمن تماماً ويجعل فتح التطبيق بدون نت
  // أسرع وأكثر ثباتاً.
  if (
    url.origin === self.location.origin &&
    /\.(js|css|woff2?|png|jpg|jpeg|svg|ico)$/.test(url.pathname)
  ) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const cached = await cache.match(req)
        if (cached) return cached
        try {
          const res = await fetch(req)
          cache.put(req, res.clone())
          return res
        } catch {
          return Response.error()
        }
      }),
    )
  }
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
