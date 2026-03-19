/**
 * SongLearnView - Full-featured song learning panel
 * Shows lyrics, guitar tabs, chord diagrams, and key info for a song.
 * Works with both local songs and external (discovered) songs.
 */
import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card } from '@/components/ui/card'
import {
  Guitar, FileText, Music, ArrowSquareOut, X, MusicNote, Metronome,
  Key, CopySimple, CheckCircle, Info
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import type { ExternalSong } from '@/types'
import { toast } from 'sonner'

interface SongLearnViewProps {
  song: ExternalSong
  onClose?: () => void
}

// Parse raw tab/chord content into structured lines
function parseTabContent(content: string) {
  const lines = content.split('\n')
  const sections: { type: 'heading' | 'tab' | 'chord' | 'lyric' | 'blank'; content: string }[] = []

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) {
      sections.push({ type: 'blank', content: '' })
    } else if (/^\[.+\]$/.test(trimmed) || /^(Verse|Chorus|Bridge|Intro|Outro|Solo|Pre-Chorus|Hook)\s*\d*:/i.test(trimmed)) {
      sections.push({ type: 'heading', content: trimmed })
    } else if (/^[eEbBgGdDA]\|/.test(trimmed) || /^\|?[-|0-9hpbr/\\~x]+\|/.test(trimmed)) {
      sections.push({ type: 'tab', content: line })
    } else if (/^([A-G][#b]?(maj|min|m|sus|dim|aug|add|M)?[0-9]*(\/[A-G][#b]?)?(\s+[A-G][#b]?(maj|min|m|sus|dim|aug|add|M)?[0-9]*(\/[A-G][#b]?)?)*\s*)$/.test(trimmed)) {
      sections.push({ type: 'chord', content: trimmed })
    } else {
      sections.push({ type: 'lyric', content: line })
    }
  }

  return sections
}

// Extract unique chord names from content
function extractChords(content: string): string[] {
  const chordPattern = /\b([A-G][#b]?(maj7?|min7?|m7?|sus[24]?|dim7?|aug|add9|M7|7|9|11|13)?(\/[A-G][#b]?)?)\b/g
  const matches = new Set<string>()
  let match
  while ((match = chordPattern.exec(content)) !== null) {
    if (match[1].length >= 1) matches.add(match[1])
  }
  return Array.from(matches).slice(0, 20)
}

function TabRenderer({ content }: { content: string }) {
  const lines = parseTabContent(content)
  return (
    <div className="font-mono text-sm leading-relaxed space-y-0">
      {lines.map((line, i) => {
        if (line.type === 'blank') return <div key={i} className="h-3" />
        if (line.type === 'heading') return (
          <div key={i} className="mt-4 mb-1 font-sans font-bold text-primary text-sm">
            {line.content}
          </div>
        )
        if (line.type === 'tab') return (
          <div key={i} className="text-primary/80 whitespace-pre bg-black/10 rounded px-1">
            {line.content || ' '}
          </div>
        )
        if (line.type === 'chord') return (
          <div key={i} className="text-accent font-semibold whitespace-pre">
            {line.content}
          </div>
        )
        return (
          <div key={i} className="text-foreground/80 whitespace-pre">
            {line.content || ' '}
          </div>
        )
      })}
    </div>
  )
}

function LyricsRenderer({ content }: { content: string }) {
  const lines = content.split('\n')
  let inBlock = false

  return (
    <div className="space-y-0 text-sm leading-loose">
      {lines.map((line, i) => {
        const trimmed = line.trim()
        if (!trimmed) {
          inBlock = false
          return <div key={i} className="h-4" />
        }
        const isHeading = /^\[.+\]$/.test(trimmed) || /^(Verse|Chorus|Bridge|Intro|Outro|Solo|Pre-Chorus|Hook)\s*\d*:/i.test(trimmed)
        if (isHeading) {
          inBlock = true
          return (
            <div key={i} className="mt-5 mb-1 font-semibold text-primary/80 text-xs uppercase tracking-wider">
              {trimmed.replace(/[\[\]]/g, '')}
            </div>
          )
        }
        return (
          <div key={i} className="text-foreground/90">
            {line}
          </div>
        )
      })}
    </div>
  )
}

function ChordBadge({ chord }: { chord: string }) {
  const colors = [
    'bg-violet-500/15 text-violet-300 border-violet-500/30',
    'bg-blue-500/15 text-blue-300 border-blue-500/30',
    'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    'bg-orange-500/15 text-orange-300 border-orange-500/30',
    'bg-pink-500/15 text-pink-300 border-pink-500/30',
    'bg-teal-500/15 text-teal-300 border-teal-500/30',
    'bg-amber-500/15 text-amber-300 border-amber-500/30',
    'bg-red-500/15 text-red-300 border-red-500/30',
  ]
  let hash = 0
  for (let i = 0; i < chord.length; i++) hash = chord.charCodeAt(i) + ((hash << 5) - hash)
  const color = colors[Math.abs(hash) % colors.length]

  return (
    <span className={cn('inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-mono font-semibold border', color)}>
      {chord}
    </span>
  )
}

export function SongLearnView({ song, onClose }: SongLearnViewProps) {
  const [copied, setCopied] = useState(false)

  const tabContent = song.chords?.join('\n') ?? ''
  const lyricsContent = song.lyrics ?? ''

  const chordsInTabs = useMemo(() => extractChords(tabContent), [tabContent])
  const chordsInLyrics = useMemo(() => extractChords(lyricsContent), [lyricsContent])
  const allChords = useMemo(() => {
    const set = new Set([...chordsInTabs, ...chordsInLyrics])
    return Array.from(set)
  }, [chordsInTabs, chordsInLyrics])

  const hasContent = tabContent.length > 0 || lyricsContent.length > 0

  const handleCopy = async (content: string) => {
    await navigator.clipboard.writeText(content)
    setCopied(true)
    toast.success('Copied to clipboard')
    setTimeout(() => setCopied(false), 2000)
  }

  const defaultTab = tabContent ? 'tabs' : lyricsContent ? 'lyrics' : 'info'

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col h-full"
    >
      {/* Header */}
      <div className="flex items-start justify-between p-5 pb-4 border-b border-border shrink-0">
        <div className="flex items-start gap-4 min-w-0">
          <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center text-xl font-bold text-primary shrink-0">
            {song.title.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-bold truncate">{song.title}</h2>
            {song.artist && <p className="text-muted-foreground text-sm">{song.artist}</p>}
            <div className="flex gap-2 mt-2 flex-wrap">
              <Badge variant="outline" className="text-xs">{song.provider}</Badge>
              {song.cachedMetadata?.duration && (
                <Badge variant="outline" className="text-xs">
                  {Math.floor(song.cachedMetadata.duration / 60)}:{String(song.cachedMetadata.duration % 60).padStart(2, '0')}
                </Badge>
              )}
              {song.cachedMetadata?.key && (
                <Badge variant="outline" className="text-xs">
                  <Key size={10} className="mr-1" />
                  Key of {song.cachedMetadata.key}
                </Badge>
              )}
              {song.cachedMetadata?.tempo && (
                <Badge variant="outline" className="text-xs">
                  <Metronome size={10} className="mr-1" />
                  {song.cachedMetadata.tempo} BPM
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2 ml-4 shrink-0">
          <a href={song.url} target="_blank" rel="noopener noreferrer">
            <Button size="sm" variant="outline" className="gap-1.5">
              <ArrowSquareOut size={14} />
              Source
            </Button>
          </a>
          {onClose && (
            <Button size="sm" variant="ghost" onClick={onClose} className="w-8 h-8 p-0">
              <X size={16} />
            </Button>
          )}
        </div>
      </div>

      {/* Chord Summary Bar */}
      {allChords.length > 0 && (
        <div className="px-5 py-3 border-b border-border bg-muted/30 shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Chords:</span>
            {allChords.map((chord, i) => (
              <ChordBadge key={`${chord}-${i}`} chord={chord} />
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      {!hasContent ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-3 py-16">
            <Music size={48} className="mx-auto text-muted-foreground/20" weight="duotone" />
            <p className="text-muted-foreground font-medium">No tabs or lyrics saved for this song</p>
            <p className="text-sm text-muted-foreground/70 max-w-xs mx-auto">
              You can add tabs or lyrics by editing this song in your library.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue={defaultTab} className="h-full flex flex-col">
            <div className="flex items-center justify-between px-5 pt-4 shrink-0">
              <TabsList>
                {tabContent && (
                  <TabsTrigger value="tabs" className="gap-1.5">
                    <Guitar size={14} />
                    Tabs / Chords
                  </TabsTrigger>
                )}
                {lyricsContent && (
                  <TabsTrigger value="lyrics" className="gap-1.5">
                    <FileText size={14} />
                    Lyrics
                  </TabsTrigger>
                )}
                <TabsTrigger value="info" className="gap-1.5">
                  <Info size={14} />
                  Info
                </TabsTrigger>
              </TabsList>

              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleCopy(tabContent || lyricsContent)}
                className="gap-1.5 text-xs"
              >
                {copied ? <CheckCircle size={14} weight="fill" className="text-emerald-400" /> : <CopySimple size={14} />}
                Copy
              </Button>
            </div>

            {tabContent && (
              <TabsContent value="tabs" className="flex-1 overflow-hidden mt-0 px-5 pb-5">
                <ScrollArea className="h-full mt-4">
                  <div className="p-4 bg-black/20 rounded-xl border border-border/50">
                    <TabRenderer content={tabContent} />
                  </div>
                </ScrollArea>
              </TabsContent>
            )}

            {lyricsContent && (
              <TabsContent value="lyrics" className="flex-1 overflow-hidden mt-0 px-5 pb-5">
                <ScrollArea className="h-full mt-4">
                  <div className="p-4">
                    <LyricsRenderer content={lyricsContent} />
                  </div>
                </ScrollArea>
              </TabsContent>
            )}

            <TabsContent value="info" className="px-5 pb-5 mt-4">
              <Card className="p-5">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Title</p>
                    <p>{song.title}</p>
                  </div>
                  {song.artist && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Artist</p>
                      <p>{song.artist}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Source</p>
                    <p>{song.provider}</p>
                  </div>
                          {song.cachedMetadata?.key && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Key</p>
                      <p>{song.cachedMetadata.key}</p>
                    </div>
                  )}
                  {song.cachedMetadata?.tempo && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Tempo</p>
                      <p>{song.cachedMetadata.tempo} BPM</p>
                    </div>
                  )}
                  {song.cachedMetadata?.difficulty && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Difficulty</p>
                      <p className="capitalize">{song.cachedMetadata.difficulty}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Saved</p>
                    <p>{new Date(song.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </motion.div>
  )
}
