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
