import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChordCard } from '@/components/ChordCard'
import { CHORD_DATABASE } from '@/lib/chordDatabaseNew'
import { MagnifyingGlass } from '@phosphor-icons/react'

const CHORD_TYPES = [
  { value: 'major', label: 'Major' },
  { value: 'minor', label: 'Minor' },
  { value: 'seventh', label: 'Seventh' },
  { value: 'major seventh', label: 'Major 7th' },
  { value: 'minor seventh', label: 'Minor 7th' },
]

export function ChordsNew() {
  const [query, setQuery] = useState('')
  const [selectedType, setSelectedType] = useState<string | null>(null)

  const filtered = CHORD_DATABASE.filter(c =>
    c.name.toLowerCase().includes(query.toLowerCase()) &&
    (!selectedType || c.tags?.includes(selectedType))
  )

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Chord Dictionary</h1>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <MagnifyingGlass
            size={20}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            placeholder="Search chords (e.g. Am, G7, Cmaj7)…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select
          value={selectedType ?? 'all'}
          onValueChange={val => setSelectedType(val === 'all' ? null : val)}
        >
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {CHORD_TYPES.map(t => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(chord => (
            <ChordCard key={chord.id} chord={chord} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground">
          No chords found{query ? ` for "${query}"` : ''}.
        </div>
      )}
    </div>
  )
}
