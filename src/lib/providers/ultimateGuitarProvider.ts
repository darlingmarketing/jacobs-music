/**
 * Ultimate Guitar chord provider – for local, educational use only.
 *
 * Enable by setting VITE_ENABLE_ULTIMATE_PROVIDER=true in your .env.local
 * file.  When the flag is absent or false the provider is a no-op so the
 * production build stays clean and compliant.
 *
 * To see real chord data, start a local scraper (e.g. joncardasis/ultimate-api
 * or Pilfer/ultimate-guitar-scraper) and configure VITE_UG_SCRAPER_URL to
 * point at it (defaults to http://localhost:3001).
 */

import type { ExternalSongDetails, MusicProvider, ProviderSong } from './types'

/** Returns true only when the feature is explicitly opted-in. */
export function isUltimateProviderEnabled(): boolean {
  return import.meta.env.VITE_ENABLE_ULTIMATE_PROVIDER === 'true'
}

/**
 * Fetch tab details for a given Ultimate Guitar URL via a local scraper.
 *
 * The local scraper must expose a GET /tab?url=<encoded-ug-url> endpoint
 * that returns JSON with at least: song_name, artist_name, chords[], content.
 *
 * Returns null when:
 * - The feature flag is disabled
 * - The scraper is unreachable or returns a non-OK status
 * - The response cannot be parsed
 *
 * @param url - Full Ultimate Guitar tab URL, e.g.
 *   "https://tabs.ultimate-guitar.com/tab/the-beatles/let-it-be-chords-53622"
 */
export async function getTab(url: string): Promise<ExternalSongDetails | null> {
  if (!isUltimateProviderEnabled()) return null

  const scraperBase =
    (import.meta.env.VITE_UG_SCRAPER_URL as string | undefined) ?? 'http://localhost:3001'

  try {
    const res = await fetch(`${scraperBase}/tab?url=${encodeURIComponent(url)}`)
    if (!res.ok) {
      console.warn(`[UltimateGuitar] scraper returned ${res.status} for ${url}`)
      return null
    }
    const data = await res.json()
    return {
      id: url,
      provider: 'UltimateGuitar',
      title: data.song_name ?? url,
      artist: data.artist_name ?? undefined,
      chords: Array.isArray(data.chords)
        ? (data.chords as unknown[]).filter((c): c is string => typeof c === 'string')
        : undefined,
      lyrics: typeof data.content === 'string' ? data.content : undefined,
      attributionUrl: url,
    }
  } catch (err) {
    console.warn('[UltimateGuitar] failed to reach local scraper – is it running?', err)
    return null
  }
}

export const ultimateGuitarProvider: MusicProvider = {
  name: 'UltimateGuitar',

  /**
   * Keyword search is not available through the local scraper.
   * Use `getTab(url)` directly with a known tab URL instead.
   */
  async search(_query: string): Promise<ProviderSong[]> {
    return []
  },

  async getDetails(providerId: string): Promise<ProviderSong | null> {
    const details = await getTab(providerId)
    if (!details) return null
    return {
      providerId: details.id,
      provider: details.provider,
      title: details.title,
      artist: details.artist,
      url: details.attributionUrl,
      chords: details.chords,
      lyrics: details.lyrics,
    }
  },

  async getSongDetails(providerId: string): Promise<ExternalSongDetails | null> {
    return getTab(providerId)
  },
}
