import { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Song, SongSection } from '@/types'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, FloppyDisk, Plus, ArrowsClockwise } from '@phosphor-icons/react'
import { AppState } from '@/App'
import { transposeInlineChords } from '@/lib/chords'
import { parseInlineChords } from '@/lib/chords'

interface SongEditorProps {
  songId?: string
  onNavigate: (page: AppState['currentPage'], songId?: string) => void
}

export function SongEditor({ songId, onNavigate }: SongEditorProps) {
  const [songs, setSongs] = useKV<Song[]>('songs', [])
  const allSongs = songs || []
  
  const existingSong = songId ? allSongs.find(s => s.id === songId) : null
  
  const [title, setTitle] = useState(existingSong?.title || '')
  const [artist, setArtist] = useState(existingSong?.artist || '')
  const [key, setKey] = useState(existingSong?.key || 'C')
  const [capo, setCapo] = useState(existingSong?.capo || 0)
  const [tempo, setTempo] = useState(existingSong?.tempo || 120)
  const [content, setContent] = useState(
    existingSong?.sections.map(s => s.content).join('\n\n') || ''
  )
  const [transpose, setTranspose] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      if (title.trim()) {
        handleSave(false)
      }
    }, 30000)
    return () => clearInterval(timer)
  }, [title, artist, key, capo, tempo, content])

  const handleSave = (showMessage = true) => {
    if (!title.trim()) return

    const song: Song = {
      id: songId || `song-${Date.now()}`,
      userId: 'local-user',
      title,
      artist,
      key,
      capo,
      tempo,
      tags: [],
      sections: [{ id: '1', type: 'verse', content }],
      createdAt: existingSong?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    setSongs((current) => {
      const currentSongs = current || []
      const index = currentSongs.findIndex(s => s.id === song.id)
      if (index >= 0) {
        const updated = [...currentSongs]
        updated[index] = song
        return updated
      }
      return [...currentSongs, song]
    })

    if (showMessage) {
      console.log('Song saved:', title)
    }
  }

  const transposedContent = transpose !== 0 ? transposeInlineChords(content, transpose) : content

  const renderPreview = () => {
    const lines = transposedContent.split('\n')
    return lines.map((line, i) => {
      if (line.includes('[') && line.includes(']')) {
        const parts = parseInlineChords(line)
        return (
          <div key={i} className="mb-2">
            {parts.map((part, j) => (
              part.type === 'chord' ? (
                <span key={j} className="text-primary font-semibold text-sm tracking-wider mr-1">
                  {part.content}
                </span>
              ) : (
                <span key={j}>{part.content}</span>
              )
            ))}
          </div>
        )
      }
      return <div key={i} className="mb-2">{line || '\u00A0'}</div>
    })
  }

  return (
    <div className="h-full flex flex-col">
      <div className="bg-card border-b border-border px-4 md:px-6 py-4 flex items-center justify-between">
        <Button 
          variant="ghost" 
          onClick={() => onNavigate('dashboard')}
          className="gap-2"
        >
          <ArrowLeft size={20} />
          Back
        </Button>
        <Button onClick={() => handleSave(true)} className="gap-2">
          <FloppyDisk size={20} weight="fill" />
          Save Song
        </Button>
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="h-full flex flex-col md:flex-row">
          <div className="flex-1 p-4 md:p-6 overflow-y-auto">
            <div className="max-w-2xl mx-auto space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Title *</label>
                <Input
                  placeholder="Song title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Artist</label>
                <Input
                  placeholder="Artist name..."
                  value={artist}
                  onChange={(e) => setArtist(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Key</label>
                  <Select value={key} onValueChange={setKey}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].map(k => (
                        <SelectItem key={k} value={k}>{k}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Capo</label>
                  <Select value={String(capo)} onValueChange={(v) => setCapo(Number(v))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[0, 1, 2, 3, 4, 5, 6, 7].map(c => (
                        <SelectItem key={c} value={String(c)}>{c === 0 ? 'None' : c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Tempo (BPM)</label>
                  <Input
                    type="number"
                    value={tempo}
                    onChange={(e) => setTempo(Number(e.target.value))}
                    min={40}
                    max={240}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Transpose</label>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setTranspose(t => t - 1)}
                    >
                      -
                    </Button>
                    <div className="flex-1 flex items-center justify-center text-sm font-medium border rounded px-2">
                      {transpose > 0 ? `+${transpose}` : transpose}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setTranspose(t => t + 1)}
                    >
                      +
                    </Button>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Lyrics & Chords
                  <span className="text-muted-foreground font-normal ml-2">
                    (Use [G], [Am], etc. for inline chords)
                  </span>
                </label>
                <Textarea
                  placeholder="[G]Amazing [D]grace, how [Em]sweet the [C]sound..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[400px] font-mono text-sm"
                />
              </div>
            </div>
          </div>

          <div className="flex-1 p-4 md:p-6 bg-secondary/20 border-l border-border overflow-y-auto">
            <div className="max-w-2xl mx-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Preview</h3>
                {transpose !== 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setTranspose(0)}
                    className="gap-2 text-xs"
                  >
                    <ArrowsClockwise size={16} />
                    Reset Transpose
                  </Button>
                )}
              </div>
              <Card className="p-6">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold">{title || 'Untitled Song'}</h2>
                  {artist && <p className="text-muted-foreground">{artist}</p>}
                  <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                    <span>Key: {key}</span>
                    {capo > 0 && <span>Capo: {capo}</span>}
                    <span>{tempo} BPM</span>
                    {transpose !== 0 && (
                      <span className="text-primary font-medium">
                        Transposed: {transpose > 0 ? `+${transpose}` : transpose}
                      </span>
                    )}
                  </div>
                </div>
                <div className="font-mono text-sm leading-relaxed">
                  {renderPreview()}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
