import type { Song, Difficulty } from '@/types'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { X, Plus } from '@phosphor-icons/react'
import { useState } from 'react'

const KEYS = ['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B']
const TIME_SIGNATURES = ['4/4', '3/4', '6/8', '5/4', '7/8', '2/4', '12/8']
const TUNINGS = ['Standard (EADGBe)', 'Drop D (DADGBe)', 'Open G (DGDGBD)', 'Open E (EBE G#Be)', 'DADGAD', 'Half Step Down (Eb Ab Db Gb Bb Eb)']

interface MetadataPanelProps {
  song: Song
  onChange: (updates: Partial<Song>) => void
}

export function MetadataPanel({ song, onChange }: MetadataPanelProps) {
  const [tagInput, setTagInput] = useState('')

  const addTag = () => {
    const trimmed = tagInput.trim()
    if (trimmed && !song.tags.includes(trimmed)) {
      onChange({ tags: [...song.tags, trimmed] })
      setTagInput('')
    }
  }

  const removeTag = (tag: string) => {
    onChange({ tags: song.tags.filter(t => t !== tag) })
  }

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag()
    }
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="grid gap-1.5">
        <label className="text-sm font-medium">Title</label>
        <Input
          value={song.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="Song title"
        />
      </div>

      <div className="grid gap-1.5">
        <label className="text-sm font-medium">Artist</label>
        <Input
          value={song.artist || ''}
          onChange={(e) => onChange({ artist: e.target.value })}
          placeholder="Artist name"
        />
      </div>

      <div className="grid gap-1.5">
        <label className="text-sm font-medium">Description / Notes</label>
        <Textarea
          value={song.description || ''}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="Add notes about this song…"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-1.5">
          <label className="text-sm font-medium">Key</label>
          <Select value={song.key || 'C'} onValueChange={(value) => onChange({ key: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select key" />
            </SelectTrigger>
            <SelectContent>
              {KEYS.map(k => (
                <SelectItem key={k} value={k}>{k}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-1.5">
          <label className="text-sm font-medium">Tempo (BPM)</label>
          <Input
            type="number"
            value={song.tempo ?? 120}
            onChange={(e) => onChange({ tempo: parseInt(e.target.value) || 120 })}
            min={20}
            max={300}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-1.5">
          <label className="text-sm font-medium">Time Signature</label>
          <Select
            value={song.timeSignature || '4/4'}
            onValueChange={(value) => onChange({ timeSignature: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIME_SIGNATURES.map(sig => (
                <SelectItem key={sig} value={sig}>{sig}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-1.5">
          <label className="text-sm font-medium">Capo Fret</label>
          <Input
            type="number"
            value={song.capo ?? 0}
            onChange={(e) => onChange({ capo: parseInt(e.target.value) || 0 })}
            min={0}
            max={12}
          />
        </div>
      </div>

      <div className="grid gap-1.5">
        <label className="text-sm font-medium">Tuning</label>
        <Select
          value={song.tuning || 'Standard (EADGBe)'}
          onValueChange={(value) => onChange({ tuning: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TUNINGS.map(t => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-1.5">
        <label className="text-sm font-medium">Difficulty</label>
        <Select
          value={song.difficulty || 'medium'}
          onValueChange={(value: Difficulty) => onChange({ difficulty: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="easy">Easy</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="hard">Hard</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-1.5">
        <label className="text-sm font-medium">Tags</label>
        <div className="flex gap-2">
          <Input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            placeholder="Add tag…"
            className="flex-1"
          />
          <Button type="button" size="sm" variant="outline" onClick={addTag}>
            <Plus size={16} />
          </Button>
        </div>
        {song.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {song.tags.map(tag => (
              <Badge key={tag} variant="secondary" className="gap-1 pr-1">
                {tag}
                <button
                  onClick={() => removeTag(tag)}
                  className="hover:text-destructive transition-colors"
                  aria-label={`Remove tag ${tag}`}
                >
                  <X size={12} />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
