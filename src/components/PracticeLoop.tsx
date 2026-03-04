import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Play, Stop, Metronome as MetronomeIcon } from '@phosphor-icons/react'
import { audioEngine } from '@/lib/audioSynthesis'
import type { Section } from '@/types'
import { cn } from '@/lib/utils'
import { usePracticeSession } from '@/hooks/usePracticeSession'

interface PracticeLoopProps {
  sections: Section[]
  tempo?: number
  timeSignature?: string
  activeSectionId?: string | null
  onSectionChange?: (sectionId: string) => void
  songId?: string
}

const DEFAULT_TEMPO = 120
const MIN_SPEED = 50
const MAX_SPEED = 150

/**
 * PracticeLoop – a live-practice helper that loops a selected song section,
 * plays a metronome count-in before each loop, and supports speed scaling
 * and gradual tempo increase per loop.
 */
export function PracticeLoop({
  sections,
  tempo = DEFAULT_TEMPO,
  timeSignature = '4/4',
  activeSectionId,
  onSectionChange,
  songId,
}: PracticeLoopProps) {
  const [selectedSectionId, setSelectedSectionId] = useState<string>(
    activeSectionId ?? sections[0]?.id ?? ''
  )
  const [isLooping, setIsLooping] = useState(false)
  const [loopCount, setLoopCount] = useState<number | 'infinite'>(4)
  const [completedLoops, setCompletedLoops] = useState(0)
  const [speedPercent, setSpeedPercent] = useState(100)
  const [incrementPerLoop, setIncrementPerLoop] = useState(0)
  const [metronomeVolume, setMetronomeVolume] = useState(0.5)
  const [accentDownbeat, setAccentDownbeat] = useState(true)
  const [countIn, setCountIn] = useState(true)
  const [isCountingIn, setIsCountingIn] = useState(false)
  const [currentBeat, setCurrentBeat] = useState<number | null>(null)

  const stopRef = useRef(false)
  const loopTimerRef = useRef<number | null>(null)

  const beatsPerMeasure = parseInt(timeSignature.split('/')[0] ?? '4', 10) || 4

  const practiceSession = usePracticeSession('loop', { songId })

  // Keep selectedSection in sync with activeSectionId from parent
  useEffect(() => {
    if (activeSectionId && activeSectionId !== selectedSectionId) {
      setSelectedSectionId(activeSectionId)
    }
  }, [activeSectionId, selectedSectionId])

  const handleSectionSelect = (id: string) => {
    setSelectedSectionId(id)
    onSectionChange?.(id)
  }

  const clearTimer = () => {
    if (loopTimerRef.current !== null) {
      clearTimeout(loopTimerRef.current)
      loopTimerRef.current = null
    }
  }

  const scheduleBeats = useCallback(
    (effectiveTempo: number, numBeats: number, onComplete: () => void) => {
      const intervalMs = (60 / effectiveTempo) * 1000
      let beat = 0

      const tick = () => {
        if (stopRef.current) return
        const isAccent = accentDownbeat && beat % beatsPerMeasure === 0
        audioEngine.playMetronomeClick(isAccent, metronomeVolume)
        setCurrentBeat(beat % beatsPerMeasure)
        beat++
        if (beat < numBeats) {
          loopTimerRef.current = window.setTimeout(tick, intervalMs)
        } else {
          setCurrentBeat(null)
          onComplete()
        }
      }

      loopTimerRef.current = window.setTimeout(tick, 0)
    },
    [accentDownbeat, beatsPerMeasure, metronomeVolume]
  )

  const runLoop = useCallback(
    (loopIndex: number, currentSpeedPercent: number) => {
      if (stopRef.current) return

      const effectiveTempo = Math.round((tempo * currentSpeedPercent) / 100)
      const maxLoops = loopCount === 'infinite' ? Infinity : loopCount

      if (loopIndex >= maxLoops) {
        setIsLooping(false)
        setIsCountingIn(false)
        setCurrentBeat(null)
        setCompletedLoops(0)
        practiceSession.setBpm(effectiveTempo)
        practiceSession.stop()
        return
      }

      // Count-in (only before first loop when enabled)
      const doCountIn = countIn && loopIndex === 0

      const startLoop = () => {
        if (stopRef.current) return
        setIsCountingIn(false)
        setCompletedLoops(loopIndex)

        // "Play" the loop – here we schedule beats equal to a full measure
        // (or a fixed 4 beats) representing one pass through the section.
        // In a full integration this would sync with audio playback; here it
        // drives the metronome clicks and beat indicator.
        scheduleBeats(effectiveTempo, beatsPerMeasure, () => {
          if (stopRef.current) return
          practiceSession.markLoopComplete()
          const nextSpeed = currentSpeedPercent + incrementPerLoop
          runLoop(loopIndex + 1, Math.min(nextSpeed, MAX_SPEED))
        })
      }

      if (doCountIn) {
        setIsCountingIn(true)
        scheduleBeats(effectiveTempo, beatsPerMeasure, startLoop)
      } else {
        startLoop()
      }
    },
    [tempo, loopCount, countIn, scheduleBeats, beatsPerMeasure, incrementPerLoop, practiceSession]
  )

  const startLooping = useCallback(() => {
    stopRef.current = false
    setIsLooping(true)
    setCompletedLoops(0)
    practiceSession.setBpm(Math.round((tempo * speedPercent) / 100))
    practiceSession.start()
    runLoop(0, speedPercent)
  }, [runLoop, speedPercent, practiceSession, tempo])

  const stopLooping = useCallback(() => {
    stopRef.current = true
    clearTimer()
    setIsLooping(false)
    setIsCountingIn(false)
    setCurrentBeat(null)
    setCompletedLoops(0)
    practiceSession.setBpm(Math.round((tempo * speedPercent) / 100))
    practiceSession.stop()
  }, [practiceSession, tempo, speedPercent])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRef.current = true
      clearTimer()
    }
  }, [])

  const selectedSection = sections.find(s => s.id === selectedSectionId)
  const effectiveTempo = Math.round((tempo * speedPercent) / 100)
  const loopCountOptions: Array<{ value: string; label: string }> = [
    { value: '2', label: '2×' },
    { value: '4', label: '4×' },
    { value: '8', label: '8×' },
    { value: 'infinite', label: '∞ Infinite' },
  ]

  return (
    <div className="flex flex-col gap-4 p-4 bg-card rounded-lg border border-border text-sm">
      <div className="flex items-center gap-2">
        <MetronomeIcon size={18} className="text-primary shrink-0" />
        <span className="font-semibold">Practice Loop</span>
        {isLooping && (
          <Badge
            variant="outline"
            className={cn(
              'ml-auto text-xs',
              isCountingIn ? 'border-yellow-500 text-yellow-500' : 'border-green-500 text-green-500'
            )}
          >
            {isCountingIn ? 'Count-in…' : `Loop ${completedLoops + 1}${loopCount !== 'infinite' ? `/${loopCount}` : ''}`}
          </Badge>
        )}
      </div>

      {/* Section selector */}
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Section</Label>
        <Select value={selectedSectionId} onValueChange={handleSectionSelect} disabled={isLooping}>
          <SelectTrigger className="h-8">
            <SelectValue placeholder="Select section…" />
          </SelectTrigger>
          <SelectContent>
            {sections.map(s => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Loop count */}
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Loops</Label>
        <Select
          value={String(loopCount)}
          onValueChange={v => setLoopCount(v === 'infinite' ? 'infinite' : parseInt(v, 10))}
          disabled={isLooping}
        >
          <SelectTrigger className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {loopCountOptions.map(o => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Speed */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Speed</span>
          <span className="tabular-nums">
            {speedPercent}% — {effectiveTempo} BPM
          </span>
        </div>
        <Slider
          min={MIN_SPEED}
          max={MAX_SPEED}
          step={5}
          value={[speedPercent]}
          onValueChange={([v]) => setSpeedPercent(v)}
          disabled={isLooping}
          aria-label="Practice speed"
        />
      </div>

      {/* Tempo increment per loop */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Tempo increment per loop</span>
          <span className="tabular-nums">+{incrementPerLoop}%</span>
        </div>
        <Slider
          min={0}
          max={10}
          step={1}
          value={[incrementPerLoop]}
          onValueChange={([v]) => setIncrementPerLoop(v)}
          disabled={isLooping}
          aria-label="Tempo increment per loop"
        />
      </div>

      {/* Metronome volume */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Metronome volume</span>
          <span className="tabular-nums">{Math.round(metronomeVolume * 100)}%</span>
        </div>
        <Slider
          min={0}
          max={1}
          step={0.05}
          value={[metronomeVolume]}
          onValueChange={([v]) => setMetronomeVolume(v)}
          aria-label="Metronome volume"
        />
      </div>

      {/* Toggles */}
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <Switch
            id="count-in-toggle"
            checked={countIn}
            onCheckedChange={setCountIn}
            disabled={isLooping}
          />
          <Label htmlFor="count-in-toggle" className="text-xs cursor-pointer">
            Count-in
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id="accent-toggle"
            checked={accentDownbeat}
            onCheckedChange={setAccentDownbeat}
          />
          <Label htmlFor="accent-toggle" className="text-xs cursor-pointer">
            Accent downbeat
          </Label>
        </div>
      </div>

      {/* Beat indicator */}
      {isLooping && (
        <div className="flex gap-1">
          {Array.from({ length: beatsPerMeasure }).map((_, i) => (
            <motion.div
              key={i}
              className={cn(
                'flex-1 h-3 rounded',
                currentBeat === i
                  ? i === 0 && accentDownbeat
                    ? 'bg-primary'
                    : 'bg-accent'
                  : 'bg-secondary'
              )}
              animate={currentBeat === i ? { scaleY: 1.6, opacity: 1 } : { scaleY: 1, opacity: 0.5 }}
              transition={{ duration: 0.075 }}
            />
          ))}
        </div>
      )}

      {/* Animated count-in overlay */}
      <AnimatePresence>
        {isCountingIn && currentBeat !== null && (
          <motion.div
            key={currentBeat}
            className="flex items-center justify-center"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.4, opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            <motion.span
              className="text-4xl font-bold text-yellow-500 tabular-nums"
            >
              {currentBeat + 1}
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Start / Stop */}
      <Button
        onClick={isLooping ? stopLooping : startLooping}
        disabled={!selectedSection}
        className={cn(
          'w-full gap-2',
          isLooping ? 'bg-red-600 hover:bg-red-700 text-white' : ''
        )}
        size="sm"
      >
        {isLooping ? (
          <>
            <Stop size={14} />
            Stop Loop
          </>
        ) : (
          <>
            <Play size={14} />
            Start Loop
          </>
        )}
      </Button>
    </div>
  )
}
