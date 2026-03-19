import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useKV } from '@github/spark/hooks'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  MagnifyingGlass, Plus, Clock, MusicNote, ArrowsOut, Guitar, BookBookmark,
  CaretDown, CaretUp, X, ListBullets, FileText, Music, Compass, CheckCircle,
  ArrowSquareOut, SpinnerGap, Database
} from '@phosphor-icons/react'
import { AppState } from '@/App'
import {
  searchAllProviders, musicBrainzProvider, lrclibProvider, ultimateGuitarProvider,
  emilsTabsProvider, jDarksProvider, isUltimateProviderEnabled,
  type ProviderSong, type MusicProvider, type ExternalSongDetails
} from '@/lib/providers'
import type { ExternalSong } from '@/types'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface DiscoverProps {
  onNavigate: (page: AppState['currentPage'], songId?: string) => void
}

const PROVIDERS: { value: string; label: string; provider: MusicProvider | 'all'; color: string; description: string }[] = [
  { value: 'all', label: 'All Sources', provider: 'all', color: 'from-primary/20 to-primary/5 border-primary/20 text-primary', description: 'Search everywhere' },
  { value: 'musicbrainz', label: 'MusicBrainz', provider: musicBrainzProvider, color: 'from-orange-500/15 to-orange-500/5 border-orange-500/20 text-orange-400', description: 'Song metadata' },
  { value: 'lrclib', label: 'LRCLIB', provider: lrclibProvider, color: 'from-blue-500/15 to-blue-500/5 border-blue-500/20 text-blue-400', description: 'Lyrics & tracks' },
  { value: 'emilstabs', label: 'EmilsTabs', provider: emilsTabsProvider, color: 'from-violet-500/15 to-violet-500/5 border-violet-500/20 text-violet-400', description: 'Jam / Phish tabs' },
  { value: 'jdarks', label: 'JDarks', provider: jDarksProvider, color: 'from-emerald-500/15 to-emerald-500/5 border-emerald-500/20 text-emerald-400', description: 'Dead / Bluegrass' },
  ...(isUltimateProviderEnabled()
    ? [{ value: 'ultimateguitar', label: 'Ultimate Guitar', provider: ultimateGuitarProvider as MusicProvider, color: 'from-red-500/15 to-red-500/5 border-red-500/20 text-red-400', description: 'Tabs (local)' }]
    : []),
]

const PROVIDER_BADGE_COLORS: Record<string, string> = {
  MusicBrainz: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  LRCLIB: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  EmilsTabs: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
  JDarks: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  UltimateGuitar: 'bg-red-500/15 text-red-400 border-red-500/30',
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function getAvatarColor(str: string): string {
  const colors = [
    'bg-violet-500/20 text-violet-300',
    'bg-blue-500/20 text-blue-300',
    'bg-emerald-500/20 text-emerald-300',
    'bg-orange-500/20 text-orange-300',
    'bg-pink-500/20 text-pink-300',
    'bg-teal-500/20 text-teal-300',
    'bg-amber-500/20 text-amber-300',
    'bg-red-500/20 text-red-300',
  ]
  let hash = 0
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

function TabContent({ content }: { content: string }) {
  const lines = content.split('\n')
  return (
    <pre className="font-mono text-xs leading-relaxed whitespace-pre overflow-x-auto p-4 bg-black/20 rounded-lg border border-border/50 text-foreground/90">
      {lines.map((line, i) => {
        // Highlight tab lines (contain hyphens and pipe chars)
        const isTabLine = /^[eEbBgGdDAD]?\|/.test(line) || /^[-|hpbr/\\~x0-9]+$/.test(line.trim()) && line.trim().length > 4
        return (
          <span key={i} className={cn('block', isTabLine && 'text-primary/90')}>
            {line || ' '}
          </span>
        )
      })}
    </pre>
  )
}

function SongDetailSheet({
  song,
  details,
  onClose,
  onSave,
  isSaved,
}: {
  song: ProviderSong
  details: ExternalSongDetails | null
  onClose: () => void
  onSave: () => void
  isSaved: boolean
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start justify-between p-6 pb-4 border-b border-border">
        <div className="flex items-start gap-4">
          <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold shrink-0', getAvatarColor(song.title))}>
            {song.title.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold leading-tight">{song.title}</h2>
            {song.artist && <p className="text-muted-foreground mt-0.5">{song.artist}</p>}
            <div className="flex gap-2 mt-2 flex-wrap">
              <Badge variant="outline" className={cn('text-xs', PROVIDER_BADGE_COLORS[song.provider] ?? '')}>
                {song.provider}
              </Badge>
              {song.cachedMetadata?.duration && (
                <Badge variant="outline" className="text-xs">
                  <Clock size={10} className="mr-1" />
                  {formatDuration(song.cachedMetadata.duration)}
                </Badge>
              )}
              {song.cachedMetadata?.releaseDate && (
                <Badge variant="outline" className="text-xs">{song.cachedMetadata.releaseDate}</Badge>
              )}
              {song.cachedMetadata?.album && (
                <Badge variant="outline" className="text-xs">{song.cachedMetadata.album}</Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2 shrink-0 ml-4">
          <Button
            size="sm"
            variant={isSaved ? 'secondary' : 'default'}
            onClick={onSave}
            disabled={isSaved}
            className="gap-1.5"
          >
            {isSaved ? <CheckCircle size={14} weight="fill" /> : <BookBookmark size={14} />}
            {isSaved ? 'Saved' : 'Save'}
          </Button>
          <a
            href={song.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button size="sm" variant="outline" className="gap-1.5">
              <ArrowSquareOut size={14} />
              Source
            </Button>
          </a>
          <Button size="sm" variant="ghost" onClick={onClose} className="w-8 h-8 p-0">
            <X size={16} />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {details ? (
          <Tabs defaultValue={details.chords && details.chords.length > 0 ? 'tabs' : details.lyrics ? 'lyrics' : 'info'} className="h-full flex flex-col">
            <TabsList className="mx-6 mt-4 shrink-0">
              {details.chords && details.chords.length > 0 && (
                <TabsTrigger value="tabs" className="gap-1.5">
                  <Guitar size={14} />
                  Tabs / Chords
                </TabsTrigger>
              )}
              {details.lyrics && (
                <TabsTrigger value="lyrics" className="gap-1.5">
                  <FileText size={14} />
                  Lyrics
                </TabsTrigger>
              )}
              <TabsTrigger value="info" className="gap-1.5">
                <Music size={14} />
                Info
              </TabsTrigger>
            </TabsList>

            {details.chords && details.chords.length > 0 && (
              <TabsContent value="tabs" className="flex-1 overflow-hidden mt-0 px-6 pb-6">
                <ScrollArea className="h-full mt-4">
                  <TabContent content={details.chords.join('\n')} />
                </ScrollArea>
              </TabsContent>
            )}

            {details.lyrics && (
              <TabsContent value="lyrics" className="flex-1 overflow-hidden mt-0 px-6 pb-6">
                <ScrollArea className="h-full mt-4">
                  <pre className="font-sans text-sm leading-relaxed whitespace-pre-wrap">{details.lyrics}</pre>
                </ScrollArea>
              </TabsContent>
            )}

            <TabsContent value="info" className="px-6 pb-6 mt-4">
              <div className="space-y-3">
                {details.title && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Title</p>
                    <p className="mt-1">{details.title}</p>
                  </div>
                )}
                {details.artist && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Artist</p>
                    <p className="mt-1">{details.artist}</p>
                  </div>
                )}
                {details.attributionUrl && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Source</p>
                    <a
                      href={details.attributionUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 text-primary hover:underline text-sm inline-flex items-center gap-1"
                    >
                      View on {details.provider} <ArrowSquareOut size={12} />
                    </a>
                  </div>
                )}
                {!details.chords && !details.lyrics && (
                  <p className="text-sm text-muted-foreground">No additional details available from this provider.</p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center space-y-2">
              <Music size={40} className="mx-auto opacity-30" weight="duotone" />
              <p className="text-sm">Loading details...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
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
  const [detailSong, setDetailSong] = useState<ProviderSong | null>(null)
  const [activeTab, setActiveTab] = useState<'results' | 'saved'>('results')

  const saved = externalSongs ?? []

  const handleSearch = async () => {
    const q = search.trim()
    if (!q) return
    setLoading(true)
    setSearched(true)
    setActiveTab('results')
    try {
      const entry = PROVIDERS.find(p => p.value === providerKey)
      let data: ProviderSong[]
      if (!entry || entry.provider === 'all') {
        data = await searchAllProviders(q)
      } else {
        data = await (entry.provider as MusicProvider).search(q)
      }
      setResults(data)
    } catch {
      toast.error('Search failed. Please try again.')
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDetail = async (song: ProviderSong) => {
    setDetailSong(song)
    const key = `${song.provider}-${song.providerId}`
    if (loadedDetails[key] || loadingDetails.has(key)) return
    setLoadingDetails(prev => new Set(prev).add(key))
    try {
      const entry = PROVIDERS.find(p => p.label === song.provider || p.value === song.provider.toLowerCase())
      const provider = entry && entry.provider !== 'all' ? (entry.provider as MusicProvider) : null
      const details = provider ? await provider.getSongDetails(song.providerId) : null
      if (details) {
        setLoadedDetails(prev => ({ ...prev, [key]: details }))
      }
    } catch {
      toast.error('Failed to load song details.')
    } finally {
      setLoadingDetails(prev => { const s = new Set(prev); s.delete(key); return s })
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

  const detailKey = detailSong ? `${detailSong.provider}-${detailSong.providerId}` : null
  const detailData = detailKey ? loadedDetails[detailKey] ?? null : null

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight flex items-center gap-3">
            <Compass size={32} className="text-primary" weight="duotone" />
            Discover
          </h1>
          <p className="text-muted-foreground mt-1">Find tabs, lyrics, chords, and song info from top music sources</p>
        </div>
        {saved.length > 0 && (
          <Button variant="outline" size="sm" onClick={() => setActiveTab('saved')} className="gap-2 shrink-0">
            <BookBookmark size={16} />
            Saved ({saved.length})
          </Button>
        )}
      </div>

      {/* Search Bar */}
      <Card className="p-4 md:p-6">
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <MagnifyingGlass size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search for songs, artists, tabs..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                className="pl-10 h-11"
              />
            </div>
            <Button
              className="h-11 gap-2 px-6 shrink-0"
              onClick={handleSearch}
              disabled={loading || !search.trim()}
            >
              {loading ? (
                <SpinnerGap size={18} className="animate-spin" />
              ) : (
                <MagnifyingGlass size={18} />
              )}
              <span className="hidden sm:inline">{loading ? 'Searching...' : 'Search'}</span>
            </Button>
          </div>

          {/* Provider selector */}
          <div className="flex flex-wrap gap-2">
            {PROVIDERS.map(p => (
              <button
                key={p.value}
                onClick={() => setProviderKey(p.value)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                  providerKey === p.value
                    ? cn('bg-gradient-to-br', p.color, 'opacity-100')
                    : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
                )}
              >
                {p.label}
                <span className={cn('ml-1 opacity-60', providerKey === p.value && 'opacity-80')}>
                  · {p.description}
                </span>
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Results / Saved Tabs */}
      {(searched || saved.length > 0) && (
        <div className="flex gap-3 border-b border-border">
          <button
            onClick={() => setActiveTab('results')}
            className={cn(
              'pb-3 px-1 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'results'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            Results {results.length > 0 && `(${results.length})`}
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            className={cn(
              'pb-3 px-1 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'saved'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            Saved Library {saved.length > 0 && `(${saved.length})`}
          </button>
        </div>
      )}

      {/* Results Tab */}
      {activeTab === 'results' && (
        <AnimatePresence mode="wait">
          {loading && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="grid gap-3">
                {[...Array(4)].map((_, i) => (
                  <Card key={i} className="p-4 animate-pulse">
                    <div className="flex gap-3">
                      <div className="w-10 h-10 rounded-xl bg-muted shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-muted rounded w-1/3" />
                        <div className="h-3 bg-muted rounded w-1/4" />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </motion.div>
          )}

          {!loading && searched && results.length === 0 && (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card className="p-12 text-center">
                <MusicNote size={40} className="mx-auto text-muted-foreground/30 mb-3" weight="duotone" />
                <p className="font-medium">No results found</p>
                <p className="text-sm text-muted-foreground mt-1">Try a different search term or provider</p>
              </Card>
            </motion.div>
          )}

          {!loading && results.length > 0 && (
            <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
              {results.map((song, i) => {
                const key = `${song.provider}-${song.providerId}`
                const isLoadingDetail = loadingDetails.has(key)
                const saved_ = isSaved(song)

                return (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <Card
                      className="p-4 hover:border-primary/30 transition-colors cursor-pointer group"
                      onClick={() => handleOpenDetail(song)}
                    >
                      <div className="flex items-start gap-3">
                        {/* Avatar */}
                        <div className={cn(
                          'w-10 h-10 rounded-xl flex items-center justify-center text-base font-bold shrink-0',
                          getAvatarColor(song.title)
                        )}>
                          {song.title.charAt(0).toUpperCase()}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <h3 className="font-semibold truncate group-hover:text-primary transition-colors">
                                {song.title}
                              </h3>
                              {song.artist && (
                                <p className="text-sm text-muted-foreground">{song.artist}</p>
                              )}
                            </div>
                            <Badge
                              variant="outline"
                              className={cn('text-xs shrink-0', PROVIDER_BADGE_COLORS[song.provider] ?? '')}
                            >
                              {song.provider}
                            </Badge>
                          </div>

                          <div className="flex gap-3 mt-1.5 text-xs text-muted-foreground flex-wrap">
                            {song.cachedMetadata?.album && <span>{song.cachedMetadata.album}</span>}
                            {song.cachedMetadata?.duration && (
                              <span className="flex items-center gap-1">
                                <Clock size={10} />
                                {formatDuration(song.cachedMetadata.duration)}
                              </span>
                            )}
                            {song.cachedMetadata?.releaseDate && (
                              <span>{song.cachedMetadata.releaseDate}</span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 shrink-0 ml-2" onClick={e => e.stopPropagation()}>
                          {isLoadingDetail && (
                            <SpinnerGap size={16} className="animate-spin text-muted-foreground" />
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="gap-1.5 text-xs"
                            onClick={e => { e.stopPropagation(); handleOpenDetail(song) }}
                          >
                            <ArrowsOut size={14} />
                            <span className="hidden sm:inline">View</span>
                          </Button>
                          <Button
                            size="sm"
                            variant={saved_ ? 'secondary' : 'outline'}
                            onClick={e => { e.stopPropagation(); handleSave(song) }}
                            disabled={saved_}
                            className="gap-1.5 text-xs"
                          >
                            {saved_ ? <CheckCircle size={14} weight="fill" /> : <Plus size={14} />}
                            {saved_ ? 'Saved' : 'Save'}
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                )
              })}
            </motion.div>
          )}

          {!searched && !loading && (
            <motion.div key="intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card className="p-12 text-center border-dashed">
                <Compass size={40} className="mx-auto text-muted-foreground/30 mb-3" weight="duotone" />
                <p className="font-medium">Search for music</p>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                  Find guitar tabs, lyrics, chords, and song metadata from MusicBrainz, LRCLIB, EmilsTabs, and more.
                </p>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Saved Library Tab */}
      {activeTab === 'saved' && (
        <AnimatePresence mode="wait">
          {saved.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card className="p-12 text-center border-dashed">
                <BookBookmark size={40} className="mx-auto text-muted-foreground/30 mb-3" weight="duotone" />
                <p className="font-medium">No saved songs yet</p>
                <p className="text-sm text-muted-foreground mt-1">Search for songs and save them to build your reference library</p>
              </Card>
            </motion.div>
          ) : (
            <motion.div key="saved" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid gap-3 md:grid-cols-2">
              {saved.map((song, i) => (
                <motion.div
                  key={song.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <Card className="p-4 hover:border-primary/30 transition-colors group">
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        'w-10 h-10 rounded-xl flex items-center justify-center text-base font-bold shrink-0',
                        getAvatarColor(song.title)
                      )}>
                        {song.title.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{song.title}</h3>
                        {song.artist && <p className="text-sm text-muted-foreground">{song.artist}</p>}
                        <div className="flex gap-2 mt-1.5 flex-wrap">
                          <Badge variant="outline" className={cn('text-xs', PROVIDER_BADGE_COLORS[song.provider] ?? '')}>
                            {song.provider}
                          </Badge>
                          {song.chords && song.chords.length > 0 && (
                            <Badge variant="outline" className="text-xs border-primary/30 text-primary">
                              <Guitar size={10} className="mr-1" />
                              Tabs
                            </Badge>
                          )}
                          {song.lyrics && (
                            <Badge variant="outline" className="text-xs border-accent/30 text-accent">
                              <FileText size={10} className="mr-1" />
                              Lyrics
                            </Badge>
                          )}
                        </div>
                      </div>
                      <a
                        href={song.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline flex items-center gap-1 shrink-0"
                      >
                        Source <ArrowSquareOut size={11} />
                      </a>
                    </div>

                    {(song.chords || song.lyrics) && (
                      <div className="mt-3 pt-3 border-t border-border/50 space-y-2">
                        {song.chords && song.chords.length > 0 && (
                          <details className="group/d">
                            <summary className="text-xs font-semibold text-muted-foreground uppercase tracking-wide cursor-pointer hover:text-foreground flex items-center gap-1">
                              <Guitar size={11} /> Chords / Tabs
                            </summary>
                            <TabContent content={song.chords.join('\n')} />
                          </details>
                        )}
                        {song.lyrics && (
                          <details>
                            <summary className="text-xs font-semibold text-muted-foreground uppercase tracking-wide cursor-pointer hover:text-foreground flex items-center gap-1">
                              <FileText size={11} /> Lyrics
                            </summary>
                            <pre className="mt-2 text-xs font-sans leading-relaxed whitespace-pre-wrap p-3 bg-muted/50 rounded-lg max-h-48 overflow-y-auto">
                              {song.lyrics}
                            </pre>
                          </details>
                        )}
                      </div>
                    )}
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Song Detail Dialog */}
      <Dialog open={detailSong !== null} onOpenChange={open => { if (!open) setDetailSong(null) }}>
        <DialogContent className="max-w-3xl h-[85vh] p-0 flex flex-col overflow-hidden">
          {detailSong && (
            <SongDetailSheet
              song={detailSong}
              details={detailData}
              onClose={() => setDetailSong(null)}
              onSave={() => handleSave(detailSong)}
              isSaved={isSaved(detailSong)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Save dialog */}
      <Dialog
        open={savingWith !== null}
        onOpenChange={open => { if (!open) { setSavingWith(null); setPasteContent('') } }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookBookmark size={20} className="text-primary" />
              Save to Library
            </DialogTitle>
          </DialogHeader>
          {savingWith && (() => {
            const savingKey = `${savingWith.provider}-${savingWith.providerId}`
            const providerLyrics = loadedDetails[savingKey]?.lyrics
            return (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold shrink-0', getAvatarColor(savingWith.title))}>
                    {savingWith.title.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold">{savingWith.title}</p>
                    {savingWith.artist && <p className="text-sm text-muted-foreground">{savingWith.artist}</p>}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Paste Chords / Lyrics{' '}
                    <span className="text-muted-foreground font-normal">(optional)</span>
                  </label>
                  <Textarea
                    placeholder={providerLyrics ? 'Pre-filled from provider. Edit as needed...' : 'Paste your chords, tabs, or lyrics here...'}
                    value={pasteContent}
                    onChange={e => setPasteContent(e.target.value)}
                    className="min-h-[140px] font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Content is stored locally on your device and never shared.
                  </p>
                </div>
              </div>
            )
          })()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSavingWith(null)}>Cancel</Button>
            <Button onClick={confirmSave} className="gap-1.5">
              <BookBookmark size={14} />
              Save to Library
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
