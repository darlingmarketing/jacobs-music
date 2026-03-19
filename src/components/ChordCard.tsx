import { lazy, Suspense } from 'react'
import { Chord, ChordVoicing } from '@/types'
import { FretboardDiagram } from '@/components/FretboardDiagramNew'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { SpeakerHigh } from '@phosphor-icons/react'
import { audioEngine } from '@/lib/audioSynthesis'
import { FavoriteButton } from '@/components/FavoriteButton'
import { chordVoicingDifficulty } from '@/lib/music/chordDifficulty'

const Fretboard3D = lazy(() => import('@/components/fretboard/Fretboard3D').then(m => ({ default: m.Fretboard3D })))

interface ChordCardProps {
  chord: Chord
  leftHanded?: boolean
  use3D?: boolean
  difficultyFilter?: 'easy' | 'medium' | 'advanced'
}

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: 'bg-green-500/10 text-green-600 border-green-500/30',
  medium: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30',
  advanced: 'bg-red-500/10 text-red-600 border-red-500/30',
}

function getVoicingDifficulty(v: ChordVoicing) {
  return chordVoicingDifficulty(v)
}

export function ChordCard({ chord, leftHanded = false, use3D = false, difficultyFilter }: ChordCardProps) {
  const visibleVoicings = difficultyFilter
    ? chord.voicings.filter(v => getVoicingDifficulty(v) === difficultyFilter)
    : chord.voicings

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h3 className="font-semibold text-lg">{chord.name}</h3>
        <div className="flex items-center gap-1 flex-wrap">
          {chord.tags?.map(tag => (
            <Badge key={tag} variant="secondary" className="text-xs capitalize">
              {tag}
            </Badge>
          ))}
          <FavoriteButton refId={chord.id} type="chord" size="sm" />
        </div>
      </div>
      <div className="overflow-x-auto">
        <div className="flex gap-4 pb-2">
          {visibleVoicings.map(voicing => {
            const difficulty = getVoicingDifficulty(voicing)
            return (
              <div key={voicing.id} className="flex flex-col items-center gap-2 flex-shrink-0">
                {use3D ? (
                  <Suspense fallback={<div className="h-[220px] w-[200px] rounded-md bg-muted/30 animate-pulse" />}>
                    <Fretboard3D voicing={voicing} leftHanded={leftHanded} />
                  </Suspense>
                ) : (
                  <FretboardDiagram voicing={voicing} leftHanded={leftHanded} />
                )}
                <div className="flex items-center gap-1 flex-wrap justify-center">
                  {voicing.tags?.map(t => (
                    <Badge key={t} variant="outline" className="text-xs capitalize">
                      {t}
                    </Badge>
                  ))}
                  <Badge
                    variant="outline"
                    className={`text-xs capitalize ${DIFFICULTY_COLORS[difficulty]}`}
                  >
                    {difficulty}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-primary"
                    title={`Play ${chord.name}`}
                    onClick={() => audioEngine.playChord(voicing.frets, voicing.baseFret)}
                  >
                    <SpeakerHigh size={14} />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </Card>
  )
}
