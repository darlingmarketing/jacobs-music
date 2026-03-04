import { Chord } from '@/types'
import { FretboardDiagram } from '@/components/FretboardDiagramNew'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { SpeakerHigh } from '@phosphor-icons/react'
import { audioEngine } from '@/lib/audioSynthesis'
import { FavoriteButton } from '@/components/FavoriteButton'

interface ChordCardProps {
  chord: Chord
  leftHanded?: boolean
}

export function ChordCard({ chord, leftHanded = false }: ChordCardProps) {
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
          {chord.voicings.map(voicing => (
            <div key={voicing.id} className="flex flex-col items-center gap-2 flex-shrink-0">
              <FretboardDiagram voicing={voicing} leftHanded={leftHanded} />
              <div className="flex items-center gap-1 flex-wrap justify-center">
                {voicing.tags?.map(t => (
                  <Badge key={t} variant="outline" className="text-xs capitalize">
                    {t}
                  </Badge>
                ))}
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
          ))}
        </div>
      </div>
    </Card>
  )
}
