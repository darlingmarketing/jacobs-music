import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MagnifyingGlass, Plus, Clock, MusicNote, ArrowsOut } from '@phosphor-icons/react'
import { AppState } from '@/App'
import { searchAllProviders, musicBrainzProvider, lrclibProvider, ultimateGuitarProvider, emilsTabsProvider, jDarksProvider, isUltimateProviderEnabled, type ProviderSong, type MusicProvider, type ExternalSongDetails } from '@/lib/providers'
import type { ExternalSong } from '@/types'
import { toast } from 'sonner'

interface DiscoverProps {
  onNavigate: (page: AppState['currentPage'], songId?: string) => void
}

const PROVIDERS: { value: string; label: string; provider: MusicProvider | 'all' }[] = [
  { value: 'all', label: 'All providers', provider: 'all' },
  { value: 'musicbrainz', label: 'MusicBrainz', provider: musicBrainzProvider },
  { value: 'lrclib', label: 'LRCLIB', provider: lrclibProvider },
  { value: 'emilstabs', label: 'EmilsTabs (Jam/Phish)', provider: emilsTabsProvider },
  { value: 'jdarks', label: 'JDarks (Dead/Bluegrass)', provider: jDarksProvider },
  ...(isUltimateProviderEnabled()
    ? [{ value: 'ultimateguitar', label: 'Ultimate Guitar (local)', provider: ultimateGuitarProvider as MusicProvider }]
    : []),
]

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export function Discover({ onNavigate }: DiscoverProps) {
  const [externalSongs, setExternalSongs] = useKV<ExternalSong[]>('external-songs', [])
  const [search, setSearch] = useState('')
  const [providerKey, setProviderKey] = useState('all')
  const [results, setResults] = useState<ProviderSong[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [savingWith, setSavingWith] = useState<ProviderSong | null>(null)
  const [pasteContent, setPasteContent] = useState('')
  const [loadedDetails, setLoadedDetails] = useState<Record<string, ExternalSongDetails>>({})
  const [loadingDetails, setLoadingDetails] = useState<Set<string>>(new Set())

  const saved = externalSongs ?? []

  const handleSearch = async () => {
    const q = search.trim()
    if (!q) return
    setLoading(true)
    setSearched(true)
    try {
      const entry = PROVIDERS.find(p => p.value === providerKey)
      let data: ProviderSong[]
      if (!entry || entry.provider === 'all') {
        data = await searchAllProviders(q)
      } else {
        data = await (entry.provider as MusicProvider).search(q)
      }
      setResults(data)
    } catch (err) {
      toast.error('Search failed. Please try again.')
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleSave = (song: ProviderSong) => {
    if (saved.some(s => s.providerId === song.providerId && s.provider === song.provider)) {
      toast.info('Already saved to library')
      return
    }
    const key = `${song.provider}-${song.providerId}`
    const details = loadedDetails[key]
    setPasteContent(details?.lyrics ?? '')
    setSavingWith(song)
  }

  const handleLoadDetails = async (song: ProviderSong) => {
    const key = `${song.provider}-${song.providerId}`
    if (loadedDetails[key] || loadingDetails.has(key)) return
    setLoadingDetails(prev => new Set(prev).add(key))
    try {
      const entry = PROVIDERS.find(p => p.label === song.provider)
      const provider = entry && entry.provider !== 'all' ? (entry.provider as MusicProvider) : null
      const details = provider ? await provider.getSongDetails(song.providerId) : null
      if (details) {
        setLoadedDetails(prev => ({ ...prev, [key]: details }))
      } else {
        toast.info('No additional details available for this song.')
      }
    } catch {
      toast.error('Failed to load song details.')
    } finally {
      setLoadingDetails(prev => { const s = new Set(prev); s.delete(key); return s })
    }
  }

  const confirmSave = () => {
    if (!savingWith) return
    const key = `${savingWith.provider}-${savingWith.providerId}`
    const details = loadedDetails[key]
    const entry: ExternalSong = {
      id: crypto.randomUUID(),
      provider: savingWith.provider,
      providerId: savingWith.providerId,
      title: savingWith.title,
      artist: savingWith.artist,
      url: savingWith.url,
      cachedMetadata: savingWith.cachedMetadata,
      chords: details?.chords,
      lyrics: pasteContent.trim() || details?.lyrics || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setExternalSongs(prev => [...(prev ?? []), entry])
    toast.success(`Saved "${savingWith.title}" to library`)
    setSavingWith(null)
    setPasteContent('')
  }
  const isSaved = (song: ProviderSong) =>
    saved.some(s => s.providerId === song.providerId && s.provider === song.provider)

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6">
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Discover</h1>

      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <MagnifyingGlass size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search for songs, artists..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
            <Select value={providerKey} onValueChange={setProviderKey}>
              <SelectTrigger className="w-44 shrink-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROVIDERS.map(p => (
                  <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button className="w-full gap-2" onClick={handleSearch} disabled={loading || !search.trim()}>
            <MagnifyingGlass size={20} />
            {loading ? 'Searching…' : 'Search'}
          </Button>
        </div>
      </Card>

      {!searched && saved.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold">Saved References</h2>
          <div className="grid gap-3">
            {saved.map(song => (
              <Card key={song.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-medium truncate">{song.title}</h3>
                      <Badge variant="outline" className="text-xs shrink-0">{song.provider}</Badge>
                    </div>
                    {song.artist && <p className="text-sm text-muted-foreground">{song.artist}</p>}
                    {song.cachedMetadata?.album && (
                      <p className="text-xs text-muted-foreground">{song.cachedMetadata.album}</p>
                    )}
                  </div>
                  <a
                    href={song.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline shrink-0 ml-4"
                  >
                    View ↗
                  </a>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {searched && results.length === 0 && !loading && (
        <Card className="p-12 text-center">
          <MusicNote size={40} className="mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No results found. Try a different search.</p>
        </Card>
      )}

      {results.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">{results.length} results</p>
          <div className="grid gap-3">
            {results.map(song => {
              const key = `${song.provider}-${song.providerId}`
              const details = loadedDetails[key]
              const isLoadingDetail = loadingDetails.has(key)
              return (
                <Card key={key} className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium truncate">{song.title}</h3>
                        <Badge variant="outline" className="text-xs shrink-0">{song.provider}</Badge>
                      </div>
                      {song.artist && <p className="text-sm text-muted-foreground">{song.artist}</p>}
                      <div className="flex gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                        {song.cachedMetadata?.album && <span>{song.cachedMetadata.album}</span>}
                        {song.cachedMetadata?.duration && (
                          <span className="flex items-center gap-1">
                            <Clock size={11} />
                            {formatDuration(song.cachedMetadata.duration)}
                          </span>
                        )}
                        {song.cachedMetadata?.releaseDate && (
                          <span>{song.cachedMetadata.releaseDate}</span>
                        )}
                      </div>
                      {details && (
                        <div className="mt-3 space-y-2">
                          {details.chords && details.chords.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Chords</p>
                              <pre className="text-xs font-mono bg-muted rounded p-2 overflow-x-auto whitespace-pre-wrap">{details.chords.join('\n')}</pre>
                            </div>
                          )}
                          {details.lyrics && (
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Lyrics</p>
                              <pre className="text-xs font-mono bg-muted rounded p-2 max-h-40 overflow-y-auto whitespace-pre-wrap">{details.lyrics}</pre>
                            </div>
                          )}
                          {!details.chords && !details.lyrics && (
                            <p className="text-xs text-muted-foreground">No chords or lyrics available from this provider.</p>
                          )}
                          {details.provider === 'UltimateGuitar' && (
                            <p className="text-xs text-muted-foreground">
                              Source:{' '}
                              <a
                                href={details.attributionUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline"
                              >
                                Ultimate Guitar
                              </a>
                              {' '}(educational use only)
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={song.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline"
                      >
                        View ↗
                      </a>
                      {!details && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleLoadDetails(song)}
                          disabled={isLoadingDetail}
                          className="gap-1"
                          title="Load chords and lyrics"
                        >
                          <ArrowsOut size={14} />
                          {isLoadingDetail ? 'Loading…' : 'Details'}
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant={isSaved(song) ? 'secondary' : 'outline'}
                        onClick={() => handleSave(song)}
                        disabled={isSaved(song)}
                        className="gap-1"
                      >
                        <Plus size={14} />
                        {isSaved(song) ? 'Saved' : 'Save'}
                      </Button>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {!searched && saved.length === 0 && (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">
            Search MusicBrainz and LRCLIB for song metadata. Save references to your library.
          </p>
        </Card>
      )}

      {/* Save with optional paste dialog */}
      <Dialog open={savingWith !== null} onOpenChange={open => { if (!open) { setSavingWith(null); setPasteContent('') } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save to Library</DialogTitle>
          </DialogHeader>
          {savingWith && (() => {
            const savingKey = `${savingWith.provider}-${savingWith.providerId}`
            const providerLyrics = loadedDetails[savingKey]?.lyrics
            return (
              <div className="space-y-4">
                <div>
                  <p className="font-medium">{savingWith.title}</p>
                  {savingWith.artist && (
                    <p className="text-sm text-muted-foreground">{savingWith.artist}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Chords / Lyrics{' '}
                    <span className="text-muted-foreground font-normal">(optional)</span>
                  </label>
                  <Textarea
                    placeholder="Paste your own chords or lyrics here…"
                    value={pasteContent}
                    onChange={e => setPasteContent(e.target.value)}
                    className="min-h-[120px] font-mono text-sm"
                  />
                  {pasteContent && (
                    <p className="text-xs text-muted-foreground">
                      {providerLyrics
                        ? 'Lyrics pre-filled from provider. Edit as needed – stored locally and not shared.'
                        : 'Your pasted content will be stored locally and is not shared.'}
                    </p>
                  )}
                </div>
              </div>
            )
          })()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSavingWith(null)}>Cancel</Button>
            <Button onClick={confirmSave} className="gap-1">
              <Plus size={14} />
              Save to Library
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
