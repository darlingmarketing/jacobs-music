/**
 * Ultimate Guitar chord provider – for local, educational use only.
 *
 * This module exposes a `getTab(url)` helper and a `MusicProvider`
 * implementation that can be wired to a local instance of
 * joncardasis/ultimate-api or the Pilfer/ultimate-guitar-scraper CLI
 * when running in a development environment.
 *
 * No requests are made to ultimateguitar.com by default; the stub returns
 * `null` so that the rest of the app degrades gracefully.  Replace the body
 * of `getTab` with a local API / CLI call for hands-on testing.
 */

import type { ExternalSongDetails, MusicProvider, ProviderSong } from './types'

/**
 * Fetch tab details for a given Ultimate Guitar URL.
 *
 * For real usage, replace the body with a call to a local ultimate-guitar
 * scraper, for example:
 *
 * ```ts
 * const res = await fetch(`http://localhost:3001/tab?url=${encodeURIComponent(url)}`)
 * if (!res.ok) return null
 * const data = await res.json()
 * return {
 *   id: url,
 *   provider: 'UltimateGuitar',
 *   title: data.song_name,
 *   artist: data.artist_name,
 *   chords: data.chords ?? [],
 *   lyrics: data.content,
 *   attributionUrl: url,
 * }
 * ```
 *
 * @param url - Full Ultimate Guitar tab URL, e.g.
 *   "https://tabs.ultimate-guitar.com/tab/the-beatles/let-it-be-chords-53622"
 */
export async function getTab(url: string): Promise<ExternalSongDetails | null> {
  // Stub: returns null until wired to a local scraper.
  // Suppress unused-variable warning while keeping the signature intact.
  void url
  return null
}

export const ultimateGuitarProvider: MusicProvider = {
  name: 'UltimateGuitar',

  /**
   * Keyword search is not available through the local stub.
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
