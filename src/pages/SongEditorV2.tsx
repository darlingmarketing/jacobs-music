import { useState, useEffect, useCallback, useMemo } from 'react'
import { useKV } from '@github/spark/hooks'
import type { Song, Section } from '@/types'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, FloppyDisk, Play, Share } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { SectionEditor } from '@/components/SectionEditor'
import { MetadataPanel } from '@/components/MetadataPanel'
import { TransposeControls } from '@/components/TransposeControls'
import { PlayMode } from '@/components/PlayMode'
import { ChordSuggestionWidget } from '@/components/ChordSuggestionWidget'
import { FavoriteButton } from '@/components/FavoriteButton'
import { useAutosave } from '@/hooks/useAutosave'

interface SongEditorV2Props {
  songId?: string
  onNavigate: (page: string, songId?: string) => void
}

export function SongEditorV2({ songId, onNavigate }: SongEditorV2Props) {
  const [songs, setSongs] = useKV<Song[]>('songs', [])
  const [currentSong, setCurrentSong] = useState<Song | null>(null)
  const [transposeSteps, setTransposeSteps] = useState(0)
  const [playModeOpen, setPlayModeOpen] = useState(false)

  useEffect(() => {
    if (songId) {
      const song = (songs || []).find(s => s.id === songId)
      if (song) setCurrentSong(song)
    } else {
      const now = new Date().toISOString()
      const newSong: Song = {
        id: `song-${Date.now()}`,
        userId: 'user-1',
        title: 'New Song',
        description: '',
        artist: '',
        key: 'C',
        tempo: 120,
        timeSignature: '4/4',
        capo: 0,
        tuning: 'Standard (EADGBe)',
        difficulty: 'medium',
        tags: [],
        sections: [
          {
            id: `section-${Date.now()}`,
            name: 'Verse 1',
            type: 'verse',
            order: 0,
            blocks: [
              {
                id: `block-${Date.now()}`,
                type: 'lyrics',
                content: '[C]Hello [G]world, this is my [Am]song\n[F]Welcome to the [C]place where I belong'
              }
            ]
          }
        ],
        createdAt: now,
        updatedAt: now
      }
      setCurrentSong(newSong)
    }
  }, [songId]) // intentionally omit `songs` – re-running on every songs update would clobber in-progress edits

  const persistSong = useCallback(
    (song: Song) => {
      setSongs(currentSongs => {
        const arr = currentSongs || []
        const idx = arr.findIndex(s => s.id === song.id)
        if (idx >= 0) {
          const next = [...arr]
          next[idx] = song
          return next
        }
        return [...arr, song]
      })
    },
    [setSongs]
  )

  const saveSong = useCallback(() => {
    if (!currentSong) return
    const updated = { ...currentSong, updatedAt: new Date().toISOString() }
    persistSong(updated)
    toast.success('Song saved!')
  }, [currentSong, persistSong])

  useAutosave(currentSong, persistSong, 3000)

  const updateMetadata = useCallback((updates: Partial<Song>) => {
    setCurrentSong(s => s ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s)
  }, [])

  const handleSectionsChange = useCallback((sections: Section[]) => {
    setCurrentSong(s => s ? { ...s, sections, updatedAt: new Date().toISOString() } : s)
  }, [])

  const handleShareSong = useCallback(() => {
    if (!currentSong) return
    const shareData = {
      title: currentSong.title,
      text: `Check out "${currentSong.title}"${currentSong.artist ? ` by ${currentSong.artist}` : ''} on Jacobs Music`,
      url: window.location.href,
    }
    if (navigator.share) {
      navigator.share(shareData).catch((err) => {
        if ((err as DOMException).name !== 'AbortError') {
          navigator.clipboard.writeText(window.location.href)
            .then(() => toast.success('Link copied to clipboard'))
            .catch(() => toast.error('Could not share or copy link'))
        }
      })
    } else {
      navigator.clipboard.writeText(window.location.href).then(() => {
        toast.success('Link copied to clipboard')
      }).catch(() => {
        toast.error('Could not copy link to clipboard')
      })
    }
  }, [currentSong])

  // Collect unique chords across all sections for the suggestion widget
  const currentChords = useMemo(() => {
    if (!currentSong) return []
    const chords = new Set<string>()
    for (const section of currentSong.sections) {
      for (const block of section.blocks) {
        const matches = block.content.match(/\[([^\]]+)\]/g)
        if (matches) matches.forEach(m => chords.add(m.slice(1, -1)))
      }
    }
    return Array.from(chords)
  }, [currentSong])

  if (!currentSong) return <div className="p-6">Loading…</div>

  if (playModeOpen) {
    return <PlayMode song={currentSong} onExit={() => setPlayModeOpen(false)} />
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Top bar */}
      <div className="border-b border-border px-4 py-3 flex items-center justify-between bg-card gap-3">
        <Button variant="ghost" size="sm" onClick={() => onNavigate('songs')} className="gap-1 shrink-0">
          <ArrowLeft size={18} />
          Back
        </Button>
        <h1 className="font-bold text-lg truncate flex-1 text-center">{currentSong.title}</h1>
        <div className="flex items-center gap-2 shrink-0">
          <FavoriteButton refId={currentSong.id} type="song" size="sm" />
          <Button onClick={handleShareSong} variant="ghost" size="icon" aria-label="Share song">
            <Share size={18} />
          </Button>
          <Button onClick={() => setPlayModeOpen(true)} variant="outline" size="sm" className="gap-1">
            <Play size={16} />
            Play
          </Button>
          <Button onClick={saveSong} variant="outline" size="sm" className="gap-1">
            <FloppyDisk size={16} />
            Save
          </Button>
        </div>
      </div>

      <Tabs defaultValue="editor" className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="px-4 shrink-0">
          <TabsTrigger value="editor">Editor</TabsTrigger>
          <TabsTrigger value="metadata">Metadata</TabsTrigger>
          <TabsTrigger value="transpose">Transpose</TabsTrigger>
        </TabsList>

        {/* Editor tab */}
        <TabsContent value="editor" className="flex-1 overflow-auto p-4">
          <div className="max-w-3xl mx-auto space-y-4">
            <SectionEditor
              sections={currentSong.sections}
              semitones={transposeSteps}
              onChange={handleSectionsChange}
            />
            {currentChords.length > 0 && (
              <ChordSuggestionWidget
                currentChords={currentChords}
                songKey={currentSong.key}
                onInsertChord={(chord) => {
                  toast.success(`Chord suggestion: ${chord} — add it to your song!`)
                }}
              />
            )}
          </div>
        </TabsContent>

        {/* Metadata tab */}
        <TabsContent value="metadata" className="flex-1 overflow-auto p-4">
          <MetadataPanel song={currentSong} onChange={updateMetadata} />
        </TabsContent>

        {/* Transpose tab */}
        <TabsContent value="transpose" className="flex-1 overflow-auto p-4">
          <div className="space-y-4 max-w-xl">
            <h2 className="text-lg font-semibold">Transpose</h2>
            <p className="text-sm text-muted-foreground">
              Shift all chord notation up or down by semitones. The preview in the editor updates live.
            </p>
            <TransposeControls
              semitones={transposeSteps}
              songKey={currentSong.key}
              capo={currentSong.capo}
              onChange={setTransposeSteps}
              onCapoChange={(capo) => updateMetadata({ capo })}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
