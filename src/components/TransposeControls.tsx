import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CaretUp, CaretDown, ArrowsClockwise } from '@phosphor-icons/react'
import { transposeChord } from '@/lib/chordParser'
import { cn } from '@/lib/utils'

interface TransposeControlsProps {
  semitones: number
  songKey?: string
  capo?: number
  onChange: (semitones: number) => void
  onCapoChange?: (capo: number) => void
}

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

function getCapoSuggestions(
  semitones: number,
  songKey?: string
): { capo: number; playKey: string; label: string }[] {
  const suggestions: { capo: number; playKey: string; label: string }[] = []

  for (let capo = 1; capo <= 7; capo++) {
    const playKey = songKey ? transposeChord(songKey, semitones - capo) : null
    if (!playKey) continue
    const openKeys = ['C', 'D', 'E', 'G', 'A']
    if (openKeys.includes(playKey)) {
      suggestions.push({
        capo,
        playKey,
        label: `Capo ${capo} → play in ${playKey}`
      })
    }
  }

  return suggestions.slice(0, 3)
}

export function TransposeControls({ semitones, songKey, capo, onChange, onCapoChange }: TransposeControlsProps) {
  const transposedKey = songKey ? transposeChord(songKey, semitones) : null
  const capoSuggestions = getCapoSuggestions(semitones, songKey)

  const label = semitones > 0 ? `+${semitones}` : String(semitones)

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-1">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onChange(semitones - 1)}
          aria-label="Transpose down one semitone"
        >
          <CaretDown size={14} />
        </Button>
        <span
          className={cn(
            'min-w-[2.5rem] text-center text-sm font-bold tabular-nums',
            semitones !== 0 && 'text-primary'
          )}
        >
          {label}
        </span>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onChange(semitones + 1)}
          aria-label="Transpose up one semitone"
        >
          <CaretUp size={14} />
        </Button>
        {semitones !== 0 && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onChange(0)}
            aria-label="Reset transposition"
          >
            <ArrowsClockwise size={14} />
          </Button>
        )}
      </div>

      {transposedKey && (
        <Badge variant="secondary" className="font-mono">
          Key: {transposedKey}
        </Badge>
      )}

      {capo !== undefined && capo > 0 && (
        <Badge variant="outline">Capo {capo}</Badge>
      )}

      {semitones !== 0 && capoSuggestions.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {capoSuggestions.map(s => (
            <Badge
              key={s.capo}
              variant="outline"
              className="cursor-pointer hover:bg-accent text-xs"
              onClick={() => {
                if (onCapoChange) onCapoChange(s.capo)
                onChange(0)
              }}
              title={`Set capo to ${s.capo} and reset transposition`}
            >
              {s.label}
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
