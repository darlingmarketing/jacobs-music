import { useState, useEffect, useCallback } from 'react'
import { useKV } from '@github/spark/hooks'
import type { Song, Section } from '@/types'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, FloppyDisk } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { SectionEditor } from '@/components/SectionEditor'
import { MetadataPanel } from '@/components/MetadataPanel'
import { TransposeControls } from '@/components/TransposeControls'
import { useAutosave } from '@/hooks/useAutosave'

interface SongEditorV2Props {
  songId?: string
  onNavigate: (page: string, songId?: string) => void
}

export function SongEditorV2({ songId, onNavigate }: SongEditorV2Props) {
  const [songs, setSongs] = useKV<Song[]>('songs', [])
  const [currentSong, setCurrentSong] = useState<Song | null>(null)
  const [transposeSteps, setTransposeSteps] = useState(0)

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

  if (!currentSong) return <div className="p-6">Loading…</div>

  return (
    <div className="h-screen flex flex-col">
      {/* Top bar */}
      <div className="border-b border-border px-4 py-3 flex items-center justify-between bg-card gap-3">
        <Button variant="ghost" size="sm" onClick={() => onNavigate('songs')} className="gap-1 shrink-0">
          <ArrowLeft size={18} />
          Back
        </Button>
        <h1 className="font-bold text-lg truncate flex-1 text-center">{currentSong.title}</h1>
        <Button onClick={saveSong} variant="outline" size="sm" className="gap-1 shrink-0">
          <FloppyDisk size={16} />
          Save
        </Button>
      </div>

      <Tabs defaultValue="editor" className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="px-4 shrink-0">
          <TabsTrigger value="editor">Editor</TabsTrigger>
          <TabsTrigger value="metadata">Metadata</TabsTrigger>
          <TabsTrigger value="transpose">Transpose</TabsTrigger>
        </TabsList>

        {/* Editor tab */}
        <TabsContent value="editor" className="flex-1 overflow-auto p-4">
          <div className="max-w-3xl mx-auto">
            <SectionEditor
              sections={currentSong.sections}
              semitones={transposeSteps}
              onChange={handleSectionsChange}
            />
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
