/**
 * Offline support utilities – service worker registration and per-item cache
 * management.  Songs and chords can be individually marked "available offline"
 * which stores them in an IndexedDB-backed KV entry so they are accessible
 * without a network connection.
 */

const SW_PATH = '/sw.js'

/** Register the service worker.  Safe to call multiple times. */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null
  try {
    const registration = await navigator.serviceWorker.register(SW_PATH, { scope: '/' })
    return registration
  } catch (err) {
    console.warn('[offline] Service worker registration failed:', err)
    return null
  }
}

/** Returns true when the browser supports service workers. */
export function isOfflineSupported(): boolean {
  return 'serviceWorker' in navigator && 'caches' in window
}

// ---------------------------------------------------------------------------
// Cache individual assets (songs / chords) on demand
// ---------------------------------------------------------------------------

const OFFLINE_CACHE = 'jacobs-music-offline-items'

/**
 * Cache a specific URL so it is available when offline.
 * Returns true on success, false when caching is not supported.
 */
export async function cacheAsset(url: string): Promise<boolean> {
  if (!('caches' in window)) return false
  try {
    const cache = await caches.open(OFFLINE_CACHE)
    await cache.add(url)
    return true
  } catch (err) {
    console.warn('[offline] cacheAsset failed for', url, err)
    return false
  }
}

/**
 * Remove a previously cached URL.
 */
export async function uncacheAsset(url: string): Promise<boolean> {
  if (!('caches' in window)) return false
  try {
    const cache = await caches.open(OFFLINE_CACHE)
    return cache.delete(url)
  } catch {
    return false
  }
}

/**
 * Check whether a URL is currently cached for offline use.
 */
export async function isAssetCached(url: string): Promise<boolean> {
  if (!('caches' in window)) return false
  try {
    const cache = await caches.open(OFFLINE_CACHE)
    const match = await cache.match(url)
    return match !== undefined
  } catch {
    return false
  }
}
