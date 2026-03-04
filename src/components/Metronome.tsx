import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Play, Pause } from '@phosphor-icons/react'
import { audioEngine } from '@/lib/audioSynthesis'
import { cn } from '@/lib/utils'
import { usePracticeSession } from '@/hooks/usePracticeSession'

type Subdivision = 'quarters' | 'eighths' | 'triplets'

const SUBDIVISION_LABELS: Record<Subdivision, string> = {
  quarters: 'Quarter notes',
  eighths: 'Eighth notes',
  triplets: 'Triplets',
}

// How many sub-ticks per beat for each subdivision
const SUBDIVISION_DIVISORS: Record<Subdivision, number> = {
  quarters: 1,
  eighths: 2,
  triplets: 3,
}

interface MetronomeProps {
  tempo?: number
  timeSignature?: string
  volume?: number
  onTempoChange?: (tempo: number) => void
}

const TAP_TIMEOUT_MS = 3000
// Look-ahead scheduler constants
const SCHEDULE_AHEAD_MS = 100  // schedule beats up to 100 ms ahead
const TICK_INTERVAL_MS  = 25   // scheduler fires every 25 ms

export function Metronome({ tempo: initialTempo = 120, timeSignature = '4/4', volume: initialVolume = 0.5, onTempoChange }: MetronomeProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [tempo, setTempo] = useState(initialTempo)
  const [volume, setVolume] = useState(initialVolume)
  const [accentEnabled, setAccentEnabled] = useState(true)
  const [subdivision, setSubdivision] = useState<Subdivision>('quarters')
  const [beat, setBeat] = useState(0)
  const tapTimesRef = useRef<number[]>([])

  const practiceSession = usePracticeSession('metronome')

  // Mutable refs for the scheduler
  const tempoRef = useRef(tempo)
  const volumeRef = useRef(volume)
  const accentRef = useRef(accentEnabled)
  const subdivisionRef = useRef(subdivision)
  const beatsPerMeasureRef = useRef(4)

  const beatsPerMeasure = parseInt(timeSignature.split('/')[0] ?? '4', 10) || 4
  useEffect(() => { beatsPerMeasureRef.current = beatsPerMeasure }, [beatsPerMeasure])
  useEffect(() => { tempoRef.current = tempo }, [tempo])
  useEffect(() => { volumeRef.current = volume }, [volume])
  useEffect(() => { accentRef.current = accentEnabled }, [accentEnabled])
  useEffect(() => { subdivisionRef.current = subdivision }, [subdivision])

  const handleTempoChange = (value: number[]) => {
    setTempo(value[0])
    onTempoChange?.(value[0])
  }

  const togglePlay = () => {
    setIsPlaying(prev => {
      const next = !prev
      if (next) {
        practiceSession.start()
      } else {
        practiceSession.stop()
      }
      return next
    })
  }

  const tapTempo = useCallback(() => {
    const now = performance.now()
    const taps = tapTimesRef.current
    taps.push(now)
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

  // WebAudio look-ahead scheduler for accurate timing
  useEffect(() => {
    if (!isPlaying) {
      setBeat(0)
      return
    }

    let audioCtx: AudioContext | null = null
    let nextTickTime = 0   // in AudioContext time (seconds)
    let subTickIndex = 0   // global sub-tick counter (resets each beat)
    let schedulerTimer: number

    const getCtx = (): AudioContext => {
      if (!audioCtx) {
        audioCtx = new AudioContext()
        nextTickTime = audioCtx.currentTime + 0.05
      }
      return audioCtx
    }

    const scheduleClick = (time: number, subTick: number) => {
      const ctx = getCtx()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      const isDownbeat = subTick === 0
      const isSubdivision = subTick % SUBDIVISION_DIVISORS[subdivisionRef.current] !== 0

      // Beat 0 = downbeat accent; other beat sub-ticks = quieter
      let freq = 800
      let vol = volumeRef.current * 0.4
      if (isDownbeat && accentRef.current) {
        freq = 1200
        vol = volumeRef.current * 0.8
      } else if (isSubdivision) {
        freq = 600
        vol = volumeRef.current * 0.2
      }

      gain.gain.setValueAtTime(vol, time)
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04)
      osc.frequency.value = freq
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(time)
      osc.stop(time + 0.04)
    }

    const scheduler = () => {
      const ctx = getCtx()
      const divisor = SUBDIVISION_DIVISORS[subdivisionRef.current]
      const beatDurationSec = 60 / tempoRef.current
      const subTickDurationSec = beatDurationSec / divisor
      const totalSubTicks = beatsPerMeasureRef.current * divisor

      while (nextTickTime < ctx.currentTime + SCHEDULE_AHEAD_MS / 1000) {
        const beatIndex = Math.floor(subTickIndex / divisor)
        const isBeatBoundary = subTickIndex % divisor === 0
        const tickType = isBeatBoundary ? (beatIndex === 0 ? 0 : 1) : 2
        scheduleClick(nextTickTime, tickType)

        // Update React beat indicator just before the tick fires
        const delay = Math.max(0, (nextTickTime - ctx.currentTime) * 1000)
        const capturedBeat = beatIndex
        window.setTimeout(() => setBeat(capturedBeat), delay)

        subTickIndex = (subTickIndex + 1) % totalSubTicks
        nextTickTime += subTickDurationSec
      }

      schedulerTimer = window.setTimeout(scheduler, TICK_INTERVAL_MS)
    }

    scheduler()

    return () => {
      window.clearTimeout(schedulerTimer)
      audioCtx?.close()
      setBeat(0)
    }
  }, [isPlaying])

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

      {/* Subdivision selector */}
      <div className="space-y-1">
        <Label className="text-sm text-muted-foreground">Subdivision</Label>
        <Select value={subdivision} onValueChange={v => setSubdivision(v as Subdivision)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(SUBDIVISION_LABELS) as Subdivision[]).map(s => (
              <SelectItem key={s} value={s}>
                {SUBDIVISION_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
