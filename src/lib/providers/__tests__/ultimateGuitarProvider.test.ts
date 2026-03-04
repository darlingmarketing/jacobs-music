import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getTab, ultimateGuitarProvider, isUltimateProviderEnabled } from '../ultimateGuitarProvider'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function setEnv(value: string | undefined) {
  if (value === undefined) {
    // @ts-expect-error – delete is allowed on the test env object
    delete import.meta.env.VITE_ENABLE_ULTIMATE_PROVIDER
  } else {
    import.meta.env.VITE_ENABLE_ULTIMATE_PROVIDER = value
  }
}

// ---------------------------------------------------------------------------
// isUltimateProviderEnabled
// ---------------------------------------------------------------------------

describe('isUltimateProviderEnabled', () => {
  afterEach(() => setEnv(undefined))

  it('returns false when env var is absent', () => {
    setEnv(undefined)
    expect(isUltimateProviderEnabled()).toBe(false)
  })

  it('returns false when env var is "false"', () => {
    setEnv('false')
    expect(isUltimateProviderEnabled()).toBe(false)
  })

  it('returns true only when env var is exactly "true"', () => {
    setEnv('true')
    expect(isUltimateProviderEnabled()).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// getTab – feature-flag disabled
// ---------------------------------------------------------------------------

describe('getTab – feature flag disabled', () => {
  beforeEach(() => setEnv('false'))
  afterEach(() => setEnv(undefined))

  it('returns null without making any network request', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    const result = await getTab('https://tabs.ultimate-guitar.com/tab/test')
    expect(result).toBeNull()
    expect(fetchSpy).not.toHaveBeenCalled()
    fetchSpy.mockRestore()
  })
})

// ---------------------------------------------------------------------------
// getTab – feature-flag enabled
// ---------------------------------------------------------------------------

describe('getTab – feature flag enabled', () => {
  beforeEach(() => setEnv('true'))
  afterEach(() => {
    setEnv(undefined)
    vi.restoreAllMocks()
  })

  it('returns null and logs a warning when the scraper returns non-OK', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(null, { status: 503 })
    )
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const url = 'https://tabs.ultimate-guitar.com/tab/test'
    const result = await getTab(url)
    expect(result).toBeNull()
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining(url)
    )
  })

  it('returns null and logs a warning when the fetch throws (scraper offline)', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new TypeError('Failed to fetch'))
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const result = await getTab('https://tabs.ultimate-guitar.com/tab/test')
    expect(result).toBeNull()
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('[UltimateGuitar]'),
      expect.any(TypeError)
    )
  })

  it('parses a valid scraper response into ExternalSongDetails', async () => {
    const mockData = {
      song_name: 'Let It Be',
      artist_name: 'The Beatles',
      chords: ['| G | D | Em | C |', '| G | D | C | G |'],
      content: 'When I find myself in times of trouble...',
    }
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(mockData), { status: 200 })
    )
    const url = 'https://tabs.ultimate-guitar.com/tab/the-beatles/let-it-be-chords-53622'
    const result = await getTab(url)
    expect(result).not.toBeNull()
    expect(result?.provider).toBe('UltimateGuitar')
    expect(result?.title).toBe('Let It Be')
    expect(result?.artist).toBe('The Beatles')
    expect(result?.chords).toEqual(mockData.chords)
    expect(result?.lyrics).toBe(mockData.content)
    expect(result?.attributionUrl).toBe(url)
  })

  it('handles missing optional fields gracefully', async () => {
    const mockData = { song_name: 'Unknown' }
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(mockData), { status: 200 })
    )
    const result = await getTab('https://tabs.ultimate-guitar.com/tab/unknown')
    expect(result?.title).toBe('Unknown')
    expect(result?.artist).toBeUndefined()
    expect(result?.chords).toBeUndefined()
    expect(result?.lyrics).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// ultimateGuitarProvider – MusicProvider interface
// ---------------------------------------------------------------------------

describe('ultimateGuitarProvider', () => {
  afterEach(() => {
    setEnv(undefined)
    vi.restoreAllMocks()
  })

  it('search() always returns an empty array', async () => {
    const results = await ultimateGuitarProvider.search('beatles')
    expect(results).toEqual([])
  })

  it('getDetails() returns null when getTab returns null', async () => {
    setEnv('false')
    const result = await ultimateGuitarProvider.getDetails('https://tabs.ultimate-guitar.com/tab/test')
    expect(result).toBeNull()
  })

  it('getDetails() maps ExternalSongDetails to ProviderSong', async () => {
    setEnv('true')
    const mockData = {
      song_name: 'Wonderwall',
      artist_name: 'Oasis',
      chords: ['Em7 | G | Dsus4 | A7sus4'],
      content: 'Today is gonna be the day...',
    }
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(mockData), { status: 200 })
    )
    const url = 'https://tabs.ultimate-guitar.com/tab/oasis/wonderwall-chords-27596'
    const result = await ultimateGuitarProvider.getDetails(url)
    expect(result?.providerId).toBe(url)
    expect(result?.provider).toBe('UltimateGuitar')
    expect(result?.title).toBe('Wonderwall')
    expect(result?.chords).toEqual(mockData.chords)
  })

  it('getSongDetails() delegates to getTab', async () => {
    setEnv('true')
    const mockData = { song_name: 'Test Song', chords: ['C G Am F'] }
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(mockData), { status: 200 })
    )
    const url = 'https://tabs.ultimate-guitar.com/tab/test'
    const result = await ultimateGuitarProvider.getSongDetails(url)
    expect(result?.provider).toBe('UltimateGuitar')
    expect(result?.chords).toEqual(mockData.chords)
  })
})
