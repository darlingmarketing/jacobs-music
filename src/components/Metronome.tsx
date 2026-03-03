import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Play, Pause } from '@phosphor-icons/react'
import { audioEngine } from '@/lib/audioSynthesis'
import { cn } from '@/lib/utils'

interface MetronomeProps {
  tempo?: number
  timeSignature?: string
  volume?: number
  onTempoChange?: (tempo: number) => void
}

export function Metronome({ tempo: initialTempo = 120, timeSignature = '4/4', volume = 0.5, onTempoChange }: MetronomeProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [tempo, setTempo] = useState(initialTempo)
  const [beat, setBeat] = useState(0)
  const intervalRef = useRef<number | null>(null)

  const beatsPerMeasure = parseInt(timeSignature.split('/')[0])

  const handleTempoChange = (value: number[]) => {
    setTempo(value[0])
    onTempoChange?.(value[0])
  }

  const togglePlay = () => {
    setIsPlaying(!isPlaying)
  }

  const tapTempo = () => {
    console.log('Tap tempo feature - track multiple taps to calculate BPM')
  }

  useEffect(() => {
    if (isPlaying) {
      const interval = (60 / tempo) * 1000

      intervalRef.current = window.setInterval(() => {
        setBeat(currentBeat => {
          const nextBeat = (currentBeat + 1) % beatsPerMeasure
          const isAccent = nextBeat === 0
          audioEngine.playMetronomeClick(isAccent, volume)
          return nextBeat
        })
      }, interval)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      setBeat(0)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isPlaying, tempo, beatsPerMeasure, volume])

  return (
    <div className="flex flex-col gap-6 p-6 bg-card rounded-lg border border-border">
      <div className="flex items-center justify-between">
        <div className="text-2xl font-bold">{tempo} BPM</div>
        <div className="text-lg text-muted-foreground">{timeSignature}</div>
      </div>

      <div className="flex gap-2 h-16">
        {Array.from({ length: beatsPerMeasure }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "flex-1 rounded-md border-2 transition-all duration-100",
              i === beat && isPlaying
                ? i === 0
                  ? "bg-primary border-primary scale-110"
                  : "bg-accent border-accent scale-105"
                : "border-border bg-secondary"
            )}
          />
        ))}
      </div>

      <div className="space-y-2">
        <div className="text-sm text-muted-foreground">Tempo</div>
        <Slider
          value={[tempo]}
          onValueChange={handleTempoChange}
          min={40}
          max={240}
          step={1}
          className="w-full"
        />
      </div>

      <div className="flex gap-2">
        <Button onClick={togglePlay} className="flex-1" size="lg">
          {isPlaying ? (
            <>
              <Pause className="mr-2" />
              Stop
            </>
          ) : (
            <>
              <Play className="mr-2" />
              Start
            </>
          )}
        </Button>
        <Button onClick={tapTempo} variant="outline" size="lg">
          Tap Tempo
        </Button>
      </div>
    </div>
  )
}
