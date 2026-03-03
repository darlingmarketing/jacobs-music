const CACHE_VERSION = 'v1'
const CACHE_NAME = `jacobs-music-${CACHE_VERSION}`

const STATIC_ASSETS = [
  '/',
  '/index.html',
]

// Assets that match these patterns will be cached on fetch (network-first with cache fallback)
const CACHEABLE_PATTERNS = [
  /\.(js|css|woff2?|ttf|otf|svg|png|jpg|jpeg|webp|ico)$/,
  /\/api\/chords/,
]

self.addEventListener('install', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  )
  ;(self as ServiceWorkerGlobalScope).skipWaiting()
})

self.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  )
  ;(self as ServiceWorkerGlobalScope).clients.claim()
})

self.addEventListener('fetch', (event: FetchEvent) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)

  // Skip non-http(s) requests
  if (!url.protocol.startsWith('http')) return

  const shouldCache =
    url.origin === self.location.origin &&
    CACHEABLE_PATTERNS.some(p => p.test(url.pathname))

  if (shouldCache) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async cache => {
        try {
          const networkResponse = await fetch(request)
          if (networkResponse.ok) {
            cache.put(request, networkResponse.clone())
          }
          return networkResponse
        } catch {
          const cached = await cache.match(request)
          return cached ?? Response.error()
        }
      })
    )
  }
})
