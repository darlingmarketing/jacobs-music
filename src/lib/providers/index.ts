/**
 * Provider abstraction for external music metadata sources.
 * Each provider implements a common interface for searching songs and
 * fetching details.  Only minimal metadata is stored locally – no full
 * lyrics or audio content.
 */

export type { ExternalSongDetails } from './types'
import type { ExternalSongDetails } from './types'

export interface ProviderSong {
  /** Unique ID within this provider's namespace */
  providerId: string
  /** Human-readable provider name, e.g. "MusicBrainz" */
  provider: string
  title: string
  artist?: string
  /** Attribution URL to the source page */
  url: string
  cachedMetadata?: {
    duration?: number
    releaseDate?: string
    album?: string
  }
  /** Chord lines fetched from provider, if available */
  chords?: string[]
  /** Raw lyrics text fetched from provider, if available */
  lyrics?: string
}

export interface MusicProvider {
  name: string
  search(query: string): Promise<ProviderSong[]>
  getDetails(providerId: string): Promise<ProviderSong | null>
  getSongDetails(providerId: string): Promise<ExternalSongDetails | null>
}

// ---------------------------------------------------------------------------
// MusicBrainz provider
// ---------------------------------------------------------------------------

const MB_BASE = 'https://musicbrainz.org/ws/2'

export const musicBrainzProvider: MusicProvider = {
  name: 'MusicBrainz',

  async search(query: string): Promise<ProviderSong[]> {
    const params = new URLSearchParams({
      query: `recording:"${query}"`,
      limit: '15',
      fmt: 'json',
    })
    const res = await fetch(`${MB_BASE}/recording?${params}`, {
      headers: { 'User-Agent': 'JacobsMusic/1.0 (github.com/yesmannow/jacobs-music)' },
    })
    if (!res.ok) throw new Error(`MusicBrainz search failed: ${res.status}`)
    const data = await res.json()
    const recordings: any[] = data.recordings ?? []
    return recordings.map((r: any) => ({
      providerId: r.id,
      provider: 'MusicBrainz',
      title: r.title,
      artist: r['artist-credit']?.[0]?.name ?? undefined,
      url: `https://musicbrainz.org/recording/${r.id}`,
      cachedMetadata: {
        duration: r.length ? Math.round(r.length / 1000) : undefined,
        releaseDate: r['first-release-date'] ?? undefined,
        album: r.releases?.[0]?.title ?? undefined,
      },
    }))
  },

  async getDetails(providerId: string): Promise<ProviderSong | null> {
    const res = await fetch(`${MB_BASE}/recording/${providerId}?inc=artist-credits+releases&fmt=json`, {
      headers: { 'User-Agent': 'JacobsMusic/1.0 (github.com/yesmannow/jacobs-music)' },
    })
    if (!res.ok) return null
    const r = await res.json()
    return {
      providerId: r.id,
      provider: 'MusicBrainz',
      title: r.title,
      artist: r['artist-credit']?.[0]?.name ?? undefined,
      url: `https://musicbrainz.org/recording/${r.id}`,
      cachedMetadata: {
        duration: r.length ? Math.round(r.length / 1000) : undefined,
        releaseDate: r['first-release-date'] ?? undefined,
        album: r.releases?.[0]?.title ?? undefined,
      },
    }
  },

  async getSongDetails(providerId: string): Promise<ExternalSongDetails | null> {
    const song = await musicBrainzProvider.getDetails(providerId)
    if (!song) return null
    return {
      id: song.providerId,
      provider: song.provider,
      title: song.title,
      artist: song.artist,
      attributionUrl: song.url,
    }
  },
}

// ---------------------------------------------------------------------------
// LRCLIB provider (metadata only – no lyric scraping)
// ---------------------------------------------------------------------------

const LRCLIB_BASE = 'https://lrclib.net/api'

export const lrclibProvider: MusicProvider = {
  name: 'LRCLIB',

  async search(query: string): Promise<ProviderSong[]> {
    const params = new URLSearchParams({ q: query })
    const res = await fetch(`${LRCLIB_BASE}/search?${params}`)
    if (!res.ok) throw new Error(`LRCLIB search failed: ${res.status}`)
    const data: any[] = await res.json()
    return (data ?? []).slice(0, 15).map((item: any) => ({
      providerId: String(item.id),
      provider: 'LRCLIB',
      title: item.trackName,
      artist: item.artistName ?? undefined,
      url: `https://lrclib.net/api/get/${item.id}`,
      cachedMetadata: {
        duration: item.duration ?? undefined,
        album: item.albumName ?? undefined,
      },
    }))
  },

  async getDetails(providerId: string): Promise<ProviderSong | null> {
    const res = await fetch(`${LRCLIB_BASE}/get/${providerId}`)
    if (!res.ok) return null
    const item = await res.json()
    return {
      providerId: String(item.id),
      provider: 'LRCLIB',
      title: item.trackName,
      artist: item.artistName ?? undefined,
      url: `https://lrclib.net/api/get/${item.id}`,
      cachedMetadata: {
        duration: item.duration ?? undefined,
        album: item.albumName ?? undefined,
      },
    }
  },

  async getSongDetails(providerId: string): Promise<ExternalSongDetails | null> {
    const res = await fetch(`${LRCLIB_BASE}/get/${providerId}`)
    if (!res.ok) return null
    const item = await res.json()
    return {
      id: String(item.id),
      provider: 'LRCLIB',
      title: item.trackName,
      artist: item.artistName ?? undefined,
      lyrics: item.plainLyrics ?? undefined,
      attributionUrl: `https://lrclib.net/api/get/${item.id}`,
    }
  },
}

// ---------------------------------------------------------------------------
// Aggregated search across all providers
// ---------------------------------------------------------------------------

export const allProviders: MusicProvider[] = [musicBrainzProvider, lrclibProvider]

export async function searchAllProviders(query: string): Promise<ProviderSong[]> {
  const results = await Promise.allSettled(allProviders.map(p => p.search(query)))
  return results
    .filter((r): r is PromiseFulfilledResult<ProviderSong[]> => r.status === 'fulfilled')
    .flatMap(r => r.value)
}
