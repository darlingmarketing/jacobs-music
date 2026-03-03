import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Play, Pause } from '@phosphor-icons/react'
import { audioEngine } from '@/lib/audioSynthesis'
import { cn } from '@/lib/utils'

interface MetronomeProps {
  tempo?: number
  timeSignature?: string
  volume?: number
  onTempoChange?: (tempo: number) => void
}

export function Metronome({ tempo: initialTempo = 120, timeSignature = '4/4', volume: initialVolume = 0.5, onTempoChange }: MetronomeProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [tempo, setTempo] = useState(initialTempo)
  const [volume, setVolume] = useState(initialVolume)
  const [accentEnabled, setAccentEnabled] = useState(true)
  const [beat, setBeat] = useState(0)
  const intervalRef = useRef<number | null>(null)
  const tapTimesRef = useRef<number[]>([])

const TAP_TIMEOUT_MS = 3000

  const handleTempoChange = (value: number[]) => {
    setTempo(value[0])
    onTempoChange?.(value[0])
  }

  const togglePlay = () => {
    setIsPlaying(prev => !prev)
  }

  const tapTempo = useCallback(() => {
    const now = performance.now()
    const taps = tapTimesRef.current
    taps.push(now)
    // Keep only taps within the last 3 seconds
    const recent = taps.filter(t => now - t < TAP_TIMEOUT_MS)
    tapTimesRef.current = recent
    if (recent.length >= 2) {
      const intervals = recent.slice(1).map((t, i) => t - recent[i])
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length
      const newTempo = Math.round(60000 / avgInterval)
      const clamped = Math.min(240, Math.max(40, newTempo))
      setTempo(clamped)
      onTempoChange?.(clamped)
    }
  }, [onTempoChange])

  useEffect(() => {
    if (isPlaying) {
      const interval = (60 / tempo) * 1000

      intervalRef.current = window.setInterval(() => {
        setBeat(currentBeat => {
          const nextBeat = (currentBeat + 1) % beatsPerMeasure
          const isAccent = accentEnabled && nextBeat === 0
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
  }, [isPlaying, tempo, beatsPerMeasure, volume, accentEnabled])

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
                ? i === 0 && accentEnabled
                  ? "bg-primary border-primary scale-110"
                  : "bg-accent border-accent scale-105"
                : "border-border bg-secondary"
            )}
          />
        ))}
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Tempo</span>
          <span>{tempo} BPM</span>
        </div>
        <Slider
          value={[tempo]}
          onValueChange={handleTempoChange}
          min={40}
          max={240}
          step={1}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Volume</span>
          <span>{Math.round(volume * 100)}%</span>
        </div>
        <Slider
          value={[volume]}
          onValueChange={val => setVolume(val[0])}
          min={0}
          max={1}
          step={0.05}
          className="w-full"
        />
      </div>

      <div className="flex items-center gap-2">
        <Switch
          id="accent-toggle"
          checked={accentEnabled}
          onCheckedChange={setAccentEnabled}
        />
        <Label htmlFor="accent-toggle" className="text-sm cursor-pointer">
          Accent downbeat
        </Label>
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
