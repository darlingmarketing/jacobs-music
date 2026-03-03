import { useState, useEffect, useCallback } from 'react'
import { useKV } from '@github/spark/hooks'
import type { Song, Section, Block, SectionType, BlockType } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Play, CaretUp, CaretDown, Trash, FloppyDisk } from '@phosphor-icons/react'
import { transposeChord, parseLyricsWithChords } from '@/lib/chordParser'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface SongEditorV2Props {
  songId?: string
  onNavigate: (page: string, songId?: string) => void
}

export function SongEditorV2({ songId, onNavigate }: SongEditorV2Props) {
  const [songs, setSongs] = useKV<Song[]>('songs', [])
  const [currentSong, setCurrentSong] = useState<Song | null>(null)
  const [transposeSteps, setTransposeSteps] = useState(0)
  const [playMode, setPlayMode] = useState(false)

  useEffect(() => {
    if (songId) {
      const song = (songs || []).find(s => s.id === songId)
      if (song) setCurrentSong(song)
    } else {
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
        tuning: 'Standard',
        difficulty: 'medium',
        tags: [],
        sections: [{
          id: `section-${Date.now()}`,
          name: 'Verse 1',
          type: 'verse',
          order: 0,
          blocks: [{
            id: `block-${Date.now()}`,
            type: 'lyrics',
            content: '[C]Hello [G]world, this is my [Am]song\n[F]Welcome to the [C]place where I belong'
          }]
        }],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      setCurrentSong(newSong)
    }
  }, [songId, songs])

  const saveSong = useCallback(() => {
    if (!currentSong) return

    setSongs(currentSongs => {
      const songsArray = currentSongs || []
      const index = songsArray.findIndex(s => s.id === currentSong.id)
      const updated = { ...currentSong, updatedAt: new Date().toISOString() }
      
      if (index >= 0) {
        const newSongs = [...songsArray]
        newSongs[index] = updated
        return newSongs
      }
      return [...songsArray, updated]
    })

    toast.success('Song saved!')
  }, [currentSong, setSongs])

  useEffect(() => {
    const interval = setInterval(() => {
      if (currentSong) saveSong()
    }, 5000)

    return () => clearInterval(interval)
  }, [currentSong, saveSong])

  const updateMetadata = (field: keyof Song, value: any) => {
    if (!currentSong) return
    setCurrentSong({ ...currentSong, [field]: value })
  }

  const addSection = () => {
    if (!currentSong) return
    const newSection: Section = {
      id: `section-${Date.now()}`,
      name: `New Section ${currentSong.sections.length + 1}`,
      type: 'verse',
      order: currentSong.sections.length,
      blocks: []
    }
    setCurrentSong({ ...currentSong, sections: [...currentSong.sections, newSection] })
  }

  const updateSection = (sectionId: string, updates: Partial<Section>) => {
    if (!currentSong) return
    setCurrentSong({
      ...currentSong,
      sections: currentSong.sections.map(s =>
        s.id === sectionId ? { ...s, ...updates } : s
      )
    })
  }

  const deleteSection = (sectionId: string) => {
    if (!currentSong) return
    setCurrentSong({
      ...currentSong,
      sections: currentSong.sections.filter(s => s.id !== sectionId)
    })
  }

  const addBlock = (sectionId: string, type: BlockType) => {
    if (!currentSong) return
    const newBlock: Block = {
      id: `block-${Date.now()}`,
      type,
      content: type === 'tab' ? 'e|---|\nB|---|\nG|---|\nD|---|\nA|---|\nE|---|' : ''
    }
    
    setCurrentSong({
      ...currentSong,
      sections: currentSong.sections.map(s =>
        s.id === sectionId ? { ...s, blocks: [...s.blocks, newBlock] } : s
      )
    })
  }

  const updateBlock = (sectionId: string, blockId: string, content: string) => {
    if (!currentSong) return
    setCurrentSong({
      ...currentSong,
      sections: currentSong.sections.map(s =>
        s.id === sectionId
          ? {
              ...s,
              blocks: s.blocks.map(b => b.id === blockId ? { ...b, content } : b)
            }
          : s
      )
    })
  }

  const deleteBlock = (sectionId: string, blockId: string) => {
    if (!currentSong) return
    setCurrentSong({
      ...currentSong,
      sections: currentSong.sections.map(s =>
        s.id === sectionId
          ? { ...s, blocks: s.blocks.filter(b => b.id !== blockId) }
          : s
      )
    })
  }

  const transposeContent = (content: string, steps: number): string => {
    return content.replace(/\[([^\]]+)\]/g, (match, chord) => {
      return `[${transposeChord(chord, steps)}]`
    })
  }

  const renderPreview = () => {
    if (!currentSong) return null

    return (
      <div className={cn("space-y-6", playMode && "text-xl")}>
        {currentSong.sections.map(section => (
          <div key={section.id} className="space-y-2">
            <h3 className="font-bold text-lg text-primary">{section.name}</h3>
            {section.blocks.map(block => {
              const transposedContent = transposeSteps !== 0
                ? transposeContent(block.content, transposeSteps)
                : block.content

              if (block.type === 'lyrics') {
                const parsed = parseLyricsWithChords(transposedContent)
                return (
                  <div key={block.id} className="space-y-1">
                    {parsed.map((line, i) => (
                      <div key={i} className="relative">
                        {line.chords && (
                          <div className="absolute -top-5 left-0 text-sm font-mono text-primary font-semibold">
                            {line.chords.map((c, ci) => (
                              <span key={ci} className="inline-block" style={{ marginLeft: ci > 0 ? '8px' : '0' }}>
                                {c.chord}
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="leading-relaxed mt-5">{line.content}</div>
                      </div>
                    ))}
                  </div>
                )
              }

              if (block.type === 'tab') {
                return (
                  <pre key={block.id} className="font-mono text-sm bg-secondary p-3 rounded overflow-x-auto">
                    {transposedContent}
                  </pre>
                )
              }

              if (block.type === 'chords') {
                return (
                  <div key={block.id} className="text-primary font-semibold font-mono">
                    {transposeContent(transposedContent, transposeSteps)}
                  </div>
                )
              }

              return <div key={block.id} className="text-muted-foreground italic">{transposedContent}</div>
            })}
          </div>
        ))}
      </div>
    )
  }

  if (!currentSong) return <div className="p-6">Loading...</div>

  if (playMode) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">{currentSong.title}</h1>
              {currentSong.artist && <p className="text-lg text-muted-foreground">{currentSong.artist}</p>}
            </div>
            <Button onClick={() => setPlayMode(false)} variant="outline">Exit Play Mode</Button>
          </div>

          <div className="flex gap-2 items-center">
            <span className="text-sm">Transpose:</span>
            <Button size="sm" variant="outline" onClick={() => setTransposeSteps(s => s - 1)}>
              <CaretDown />
            </Button>
            <span className="w-12 text-center font-bold">{transposeSteps > 0 ? '+' : ''}{transposeSteps}</span>
            <Button size="sm" variant="outline" onClick={() => setTransposeSteps(s => s + 1)}>
              <CaretUp />
            </Button>
            {currentSong.capo && currentSong.capo > 0 && (
              <Badge variant="secondary">Capo {currentSong.capo}</Badge>
            )}
          </div>

          <div className="bg-card p-6 rounded-lg border border-border">
            {renderPreview()}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="border-b border-border p-4 flex items-center justify-between bg-card">
        <Input
          value={currentSong.title}
          onChange={(e) => updateMetadata('title', e.target.value)}
          className="text-2xl font-bold border-none shadow-none focus-visible:ring-0 max-w-md"
          placeholder="Song Title"
        />
        <div className="flex gap-2">
          <Button onClick={saveSong} variant="outline">
            <FloppyDisk className="mr-2" />
            Save
          </Button>
          <Button onClick={() => setPlayMode(true)}>
            <Play className="mr-2" />
            Play Mode
          </Button>
        </div>
      </div>

      <Tabs defaultValue="editor" className="flex-1 flex flex-col">
        <TabsList className="px-4">
          <TabsTrigger value="editor">Editor</TabsTrigger>
          <TabsTrigger value="metadata">Metadata</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="metadata" className="flex-1 overflow-auto p-4">
          <Card className="p-6 max-w-2xl space-y-4">
            <div>
              <label className="text-sm font-medium">Artist</label>
              <Input
                value={currentSong.artist || ''}
                onChange={(e) => updateMetadata('artist', e.target.value)}
                placeholder="Artist name"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Key</label>
                <Select value={currentSong.key || ''} onValueChange={(value) => updateMetadata('key', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select key" />
                  </SelectTrigger>
                  <SelectContent>
                    {['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].map(key => (
                      <SelectItem key={key} value={key}>{key}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Tempo (BPM)</label>
                <Input
                  type="number"
                  value={currentSong.tempo || 120}
                  onChange={(e) => updateMetadata('tempo', parseInt(e.target.value))}
                  min={40}
                  max={240}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Time Signature</label>
                <Select value={currentSong.timeSignature || '4/4'} onValueChange={(value) => updateMetadata('timeSignature', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['4/4', '3/4', '6/8', '5/4', '7/8'].map(sig => (
                      <SelectItem key={sig} value={sig}>{sig}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Capo</label>
                <Input
                  type="number"
                  value={currentSong.capo || 0}
                  onChange={(e) => updateMetadata('capo', parseInt(e.target.value))}
                  min={0}
                  max={12}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Description / Notes</label>
              <Textarea
                value={currentSong.description || ''}
                onChange={(e) => updateMetadata('description', e.target.value)}
                placeholder="Add notes about this song..."
                rows={4}
              />
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="flex-1 overflow-auto p-6">
          <div className="max-w-3xl mx-auto">
            <div className="mb-4 flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setTransposeSteps(s => s - 1)}>
                Transpose Down
              </Button>
              <span className="px-3 py-2 text-sm">{transposeSteps > 0 ? '+' : ''}{transposeSteps}</span>
              <Button size="sm" variant="outline" onClick={() => setTransposeSteps(s => s + 1)}>
                Transpose Up
              </Button>
            </div>
            {renderPreview()}
          </div>
        </TabsContent>

        <TabsContent value="editor" className="flex-1 overflow-auto p-4">
          <div className="max-w-5xl mx-auto space-y-4">
            {currentSong.sections.map(section => (
              <Card key={section.id} className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 flex-1">
                    <Input
                      value={section.name}
                      onChange={(e) => updateSection(section.id, { name: e.target.value })}
                      className="font-semibold max-w-xs"
                    />
                    <Select
                      value={section.type}
                      onValueChange={(value: SectionType) => updateSection(section.id, { type: value })}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="intro">Intro</SelectItem>
                        <SelectItem value="verse">Verse</SelectItem>
                        <SelectItem value="chorus">Chorus</SelectItem>
                        <SelectItem value="bridge">Bridge</SelectItem>
                        <SelectItem value="solo">Solo</SelectItem>
                        <SelectItem value="outro">Outro</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => deleteSection(section.id)}>
                    <Trash />
                  </Button>
                </div>

                <div className="space-y-3">
                  {section.blocks.map(block => (
                    <div key={block.id} className="border border-border rounded p-3">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="secondary">{block.type}</Badge>
                        <Button size="sm" variant="ghost" onClick={() => deleteBlock(section.id, block.id)}>
                          <Trash size={14} />
                        </Button>
                      </div>
                      <Textarea
                        value={block.content}
                        onChange={(e) => updateBlock(section.id, block.id, e.target.value)}
                        className={cn(block.type === 'tab' && "font-mono text-sm")}
                        rows={block.type === 'tab' ? 6 : 4}
                        placeholder={
                          block.type === 'lyrics'
                            ? 'Type lyrics with chords like: [C]Hello [G]world'
                            : block.type === 'tab'
                            ? 'Enter tablature'
                            : `Enter ${block.type}`
                        }
                      />
                    </div>
                  ))}

                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => addBlock(section.id, 'lyrics')}>
                      <Plus className="mr-1" size={14} />
                      Lyrics
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => addBlock(section.id, 'chords')}>
                      <Plus className="mr-1" size={14} />
                      Chords
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => addBlock(section.id, 'tab')}>
                      <Plus className="mr-1" size={14} />
                      Tab
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => addBlock(section.id, 'note')}>
                      <Plus className="mr-1" size={14} />
                      Note
                    </Button>
                  </div>
                </div>
              </Card>
            ))}

            <Button onClick={addSection} variant="outline" className="w-full">
              <Plus className="mr-2" />
              Add Section
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
