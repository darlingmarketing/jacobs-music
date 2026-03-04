/**
 * Rich song details returned by a provider, including optional chords and
 * lyrics when available.
 */
export type ExternalSongDetails = {
  id: string
  provider: string
  title: string
  artist?: string
  /** Array of chord lines, e.g. ["| G | D | Em | C |"] */
  chords?: string[]
  /** Raw lyrics text (multi-line string) */
  lyrics?: string
  /** Attribution URL linking back to the source page */
  attributionUrl: string
}

/** A search result returned by any provider. */
export type ProviderSong = {
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

/** Common interface that every music provider must implement. */
export interface MusicProvider {
  name: string
  search(query: string): Promise<ProviderSong[]>
  getDetails(providerId: string): Promise<ProviderSong | null>
  getSongDetails(providerId: string): Promise<ExternalSongDetails | null>
}
