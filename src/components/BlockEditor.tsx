import { useState, useRef, useCallback } from 'react'
import type { Block, BlockType, AudioRecording } from '@/types'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Trash, Eye, PencilSimple } from '@phosphor-icons/react'
import { SlashCommandMenu } from '@/components/SlashCommandMenu'
import type { SlashCommand } from '@/components/SlashCommandMenu'
import { parseLyricsWithChords } from '@/lib/chordParser'
import { transposeChord } from '@/lib/chordParser'
import { AudioRecorder } from '@/components/AudioRecorder'
import { cn } from '@/lib/utils'

interface BlockEditorProps {
  block: Block
  semitones?: number
  onChange: (updates: Partial<Block>) => void
  onDelete: () => void
  onConvert: (type: BlockType) => void
}

function transposeContent(content: string, semitones: number): string {
  return content.replace(/\[([^\]]+)\]/g, (_, chord) => `[${transposeChord(chord, semitones)}]`)
}

function BlockPreview({ block, semitones = 0 }: { block: Block; semitones?: number }) {
  const content =
    semitones !== 0 ? transposeContent(block.content, semitones) : block.content

  if (block.type === 'divider') {
    return <hr className="border-border my-2" />
  }

  if (block.type === 'heading') {
    const level = block.meta?.headingLevel ?? 2
    const Tag = `h${level}` as 'h1' | 'h2' | 'h3'
    const sizeMap = { 1: 'text-2xl', 2: 'text-xl', 3: 'text-lg' } as const
    return (
      <Tag className={cn('font-bold', sizeMap[level as 1 | 2 | 3] ?? 'text-xl')}>
        {content}
      </Tag>
    )
  }

  if (block.type === 'tab') {
    return (
      <pre className="font-mono text-sm bg-secondary/50 p-3 rounded overflow-x-auto whitespace-pre">
        {content}
      </pre>
    )
  }

  if (block.type === 'chords') {
    return (
      <div className="font-mono text-primary font-semibold">
        {content
          .replace(/\[([^\]]+)\]/g, '$1')
          .split(/\s+/)
          .filter(Boolean)
          .join('  ')}
      </div>
    )
  }

  if (block.type === 'lyrics') {
    const parsed = parseLyricsWithChords(content)
    return (
      <div className="space-y-5">
        {parsed.map((line, i) => (
          <div key={i} className="relative">
            {line.chords && line.chords.length > 0 && (
              <div className="text-xs font-mono text-primary font-semibold mb-0.5 flex gap-3">
                {line.chords.map((c, ci) => (
                  <span key={ci}>{c.chord}</span>
                ))}
              </div>
            )}
            <div className="leading-relaxed">{line.content || '\u00A0'}</div>
          </div>
        ))}
      </div>
    )
  }

  if (block.type === 'note') {
    return (
      <div className="italic text-muted-foreground border-l-2 border-muted pl-3">
        {content}
      </div>
    )
  }

  if (block.type === 'audio') {
    return (
      <div className="text-sm text-muted-foreground italic">
        🎙 Audio memo{content ? `: ${content}` : ''}
      </div>
    )
  }

  return <div>{content}</div>
}

export function BlockEditor({ block, semitones = 0, onChange, onDelete, onConvert }: BlockEditorProps) {
  const [isPreview, setIsPreview] = useState(false)
  const [showSlash, setShowSlash] = useState(false)
  const [slashFilter, setSlashFilter] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const val = e.target.value
      onChange({ content: val })

      const cursor = e.target.selectionStart
      const textBefore = val.slice(0, cursor)
      const lastSlash = textBefore.lastIndexOf('/')
      if (lastSlash !== -1 && (lastSlash === 0 || textBefore[lastSlash - 1] === '\n')) {
        const filter = textBefore.slice(lastSlash + 1)
        if (!filter.includes(' ')) {
          setSlashFilter(filter)
          setShowSlash(true)
          return
        }
      }
      setShowSlash(false)
    },
    [onChange]
  )

  const handleSlashSelect = useCallback(
    (cmd: SlashCommand) => {
      setShowSlash(false)
      if (cmd.type !== block.type) {
        onConvert(cmd.type)
      }
    },
    [block.type, onConvert]
  )

  const tabPlaceholder =
    'e|---|\nB|---|\nG|---|\nD|---|\nA|---|\nE|---|'

  const placeholder =
    block.type === 'lyrics'
      ? '[C]Hello [G]world — use [Chord] notation'
      : block.type === 'chords'
      ? '| G | D | Em | C |'
      : block.type === 'tab'
      ? tabPlaceholder
      : block.type === 'note'
      ? 'Add a note or reminder…'
      : block.type === 'heading'
      ? 'Heading text…'
      : ''

  const rows =
    block.type === 'tab'
      ? 7
      : block.type === 'lyrics'
      ? 5
      : block.type === 'divider'
      ? 1
      : 3

  return (
    <div className="border border-border rounded-md overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1.5 bg-secondary/30 border-b border-border">
        <Badge variant="outline" className="text-xs capitalize">
          {block.type}
        </Badge>
        <div className="flex gap-1">
          {block.type !== 'divider' && (
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
              onClick={() => setIsPreview(p => !p)}
              title={isPreview ? 'Edit' : 'Preview'}
            >
              {isPreview ? <PencilSimple size={14} /> : <Eye size={14} />}
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
            onClick={onDelete}
            title="Delete block"
          >
            <Trash size={14} />
          </Button>
        </div>
      </div>

      <div className="relative p-2">
        {block.type === 'divider' ? (
          <div className="py-2">
            <hr className="border-border" />
          </div>
        ) : block.type === 'audio' ? (
          <AudioRecorder
            onSave={(recording: AudioRecording) => {
              onChange({ content: recording.title, audioRecordingId: recording.id })
            }}
          />
        ) : isPreview ? (
          <div className="p-2 min-h-[4rem]">
            <BlockPreview block={block} semitones={semitones} />
          </div>
        ) : (
          <Textarea
            ref={textareaRef}
            value={block.content}
            onChange={handleChange}
            placeholder={placeholder}
            rows={rows}
            className={cn(
              'resize-none border-0 shadow-none focus-visible:ring-0 p-1',
              (block.type === 'tab' || block.type === 'chords') && 'font-mono text-sm'
            )}
          />
        )}

        {showSlash && (
          <SlashCommandMenu
            filter={slashFilter}
            onSelect={handleSlashSelect}
            onClose={() => setShowSlash(false)}
          />
        )}
      </div>
    </div>
  )
}
