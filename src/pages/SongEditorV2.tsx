import { useState, useEffect, useCallback, useMemo } from 'react'
import { useKV } from '@github/spark/hooks'
import type { Song, Section } from '@/types'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, FloppyDisk, Play, Share, UploadSimple, DownloadSimple, Printer } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { SectionEditor } from '@/components/SectionEditor'
import { MetadataPanel } from '@/components/MetadataPanel'
import { TransposeControls } from '@/components/TransposeControls'
import { PlayMode } from '@/components/PlayMode'
import { ChordSuggestionWidget } from '@/components/ChordSuggestionWidget'
import { FavoriteButton } from '@/components/FavoriteButton'
import { useAutosave } from '@/hooks/useAutosave'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { exportToChordPro, importFromChordPro } from '@/lib/chordPro'

interface SongEditorV2Props {
  songId?: string
  onNavigate: (page: string, songId?: string) => void
}

export function SongEditorV2({ songId, onNavigate }: SongEditorV2Props) {
  const [songs, setSongs] = useKV<Song[]>('songs', [])
  const [currentSong, setCurrentSong] = useState<Song | null>(null)
  const [transposeSteps, setTransposeSteps] = useState(0)
  const [playModeOpen, setPlayModeOpen] = useState(false)
  const [transferOpen, setTransferOpen] = useState(false)
  const [transferTab, setTransferTab] = useState<'export' | 'import'>('export')
  const [chordProText, setChordProText] = useState('')

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

  const openPrintView = useCallback((song: Song) => {
    const escapeHtml = (s: string) =>
      s.replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')

    const body = `
      <header>
        <h1>${escapeHtml(song.title)}</h1>
        <p>${[song.artist, song.key ? `Key: ${song.key}` : null, song.tempo ? `Tempo: ${song.tempo}` : null, song.timeSignature ? `Time: ${song.timeSignature}` : null]
          .filter(Boolean)
          .map((x) => escapeHtml(String(x)))
          .join(' • ')}</p>
      </header>
      ${song.sections.map(sec => `
        <section>
          <h2>${escapeHtml(sec.name)}</h2>
          ${sec.blocks.map(b => `
            <pre>${escapeHtml(b.content ?? '')}</pre>
          `).join('')}
        </section>
      `).join('')}
    `

    const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${escapeHtml(song.title)} — Print</title>
    <style>
      :root { color-scheme: light; }
      body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, "Noto Sans", "Liberation Sans", sans-serif; margin: 32px; color: #111; }
      header { margin-bottom: 18px; padding-bottom: 12px; border-bottom: 1px solid #ddd; }
      h1 { margin: 0 0 6px; font-size: 20px; }
      header p { margin: 0; color: #444; font-size: 12px; }
      section { margin: 18px 0; page-break-inside: avoid; }
      h2 { margin: 0 0 8px; font-size: 12px; letter-spacing: 0.14em; text-transform: uppercase; color: #222; }
      pre { margin: 0 0 10px; padding: 10px 12px; background: #fafafa; border: 1px solid #eee; border-radius: 8px; white-space: pre-wrap; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; font-size: 12px; line-height: 1.4; }
      @media print { body { margin: 14mm; } pre { break-inside: avoid; } }
    </style>
  </head>
  <body>${body}</body>
</html>`

    const w = window.open('', '_blank', 'noopener,noreferrer')
    if (!w) {
      toast.error('Popup blocked — please allow popups to print')
      return
    }
    w.document.open()
    w.document.write(html)
    w.document.close()
    w.focus()
    w.print()
  }, [])

  const openExportDialog = useCallback(() => {
    if (!currentSong) return
    setTransferTab('export')
    setChordProText(exportToChordPro(currentSong))
    setTransferOpen(true)
  }, [currentSong])

  const openImportDialog = useCallback(() => {
    setTransferTab('import')
    setChordProText('')
    setTransferOpen(true)
  }, [])

  const handleDownloadChordPro = useCallback(() => {
    if (!currentSong) return
    const text = exportToChordPro(currentSong)
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const safeName = (currentSong.title || 'song').replace(/[^\w\-]+/g, '_').slice(0, 60)
    const a = document.createElement('a')
    a.href = url
    a.download = `${safeName}.pro`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('ChordPro downloaded')
  }, [currentSong])

  const handleCopyChordPro = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(chordProText)
      toast.success('Copied to clipboard')
    } catch {
      toast.error('Could not copy to clipboard')
    }
  }, [chordProText])

  const handleImportChordPro = useCallback(() => {
    if (!chordProText.trim()) {
      toast.error('Paste ChordPro text first')
      return
    }
    try {
      const imported = importFromChordPro(chordProText.trim())
      // Preserve existing userId if we have it; keep timestamps fresh.
      setCurrentSong((prev) => {
        const now = new Date().toISOString()
        return {
          ...imported,
          userId: prev?.userId ?? imported.userId ?? 'user-1',
          createdAt: prev?.createdAt ?? now,
          updatedAt: now,
        }
      })
      setTransferOpen(false)
      toast.success('Imported ChordPro into editor')
    } catch (err) {
      toast.error(`Import failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }, [chordProText])

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
          <Button onClick={openImportDialog} variant="ghost" size="icon" aria-label="Import ChordPro">
            <UploadSimple size={18} />
          </Button>
          <Button onClick={openExportDialog} variant="ghost" size="icon" aria-label="Export ChordPro">
            <DownloadSimple size={18} />
          </Button>
          <Button
            onClick={() => openPrintView(currentSong)}
            variant="ghost"
            size="icon"
            aria-label="Print / Save as PDF"
          >
            <Printer size={18} />
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

      <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{transferTab === 'export' ? 'Export ChordPro' : 'Import ChordPro'}</DialogTitle>
            <DialogDescription>
              {transferTab === 'export'
                ? 'Copy or download your song as a ChordPro file.'
                : 'Paste ChordPro text to import it into the editor.'}
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={transferTab === 'export' ? 'default' : 'outline'}
              onClick={() => {
                setTransferTab('export')
                setChordProText(exportToChordPro(currentSong))
              }}
            >
              Export
            </Button>
            <Button
              size="sm"
              variant={transferTab === 'import' ? 'default' : 'outline'}
              onClick={() => {
                setTransferTab('import')
                setChordProText('')
              }}
            >
              Import
            </Button>
          </div>

          <Textarea
            value={chordProText}
            onChange={(e) => setChordProText(e.target.value)}
            rows={14}
            className="font-mono text-xs"
            placeholder={transferTab === 'import' ? '{title: ...}\n[Verse]\n[G]...\n' : undefined}
          />

          <div className="flex flex-wrap justify-end gap-2">
            {transferTab === 'export' ? (
              <>
                <Button variant="outline" onClick={handleCopyChordPro}>Copy</Button>
                <Button onClick={handleDownloadChordPro}>Download .pro</Button>
              </>
            ) : (
              <Button onClick={handleImportChordPro}>Import into editor</Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
