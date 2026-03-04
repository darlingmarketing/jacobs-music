import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Plus, Play, Stop, ArrowsClockwise, Check, X } from '@phosphor-icons/react'

interface TrainerSession {
  chords: string[]
  currentIndex: number
  nextIndex: number
  secondsPerChord: number
  isRunning: boolean
  score: { hit: number; miss: number }
  timeLeft: number
}

const DEFAULT_CHORDS = ['C', 'G', 'Am', 'F']
const DEFAULT_SECONDS = 4
const TICK_MS = 100

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function ChordChangeTrainer() {
  const [chords, setChords] = useState<string[]>(DEFAULT_CHORDS)
  const [newChord, setNewChord] = useState('')
  const [secondsPerChord, setSecondsPerChord] = useState(DEFAULT_SECONDS)
  const [session, setSession] = useState<TrainerSession | null>(null)
  const [sequence, setSequence] = useState<string[]>([])
  const timerRef = useRef<number | null>(null)

  const clearTimer = () => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  const startSession = useCallback(() => {
    if (chords.length < 2) return
    const shuffled = shuffleArray(chords)
    setSequence(shuffled)
    setSession({
      chords: shuffled,
      currentIndex: 0,
      nextIndex: 1 % shuffled.length,
      secondsPerChord,
      isRunning: true,
      score: { hit: 0, miss: 0 },
      timeLeft: secondsPerChord,
    })
  }, [chords, secondsPerChord])

  const stopSession = useCallback(() => {
    clearTimer()
    setSession(null)
  }, [])

  const markResult = useCallback((hit: boolean) => {
    setSession(prev => {
      if (!prev) return null
      const nextIdx = (prev.currentIndex + 1) % prev.chords.length
      const afterNextIdx = (nextIdx + 1) % prev.chords.length
      return {
        ...prev,
        currentIndex: nextIdx,
        nextIndex: afterNextIdx,
        timeLeft: prev.secondsPerChord,
        score: {
          hit: prev.score.hit + (hit ? 1 : 0),
          miss: prev.score.miss + (hit ? 0 : 1),
        },
      }
    })
  }, [])

  // Single interval: decrements timeLeft and advances chord when it reaches zero
  useEffect(() => {
    if (!session?.isRunning) return

    timerRef.current = window.setInterval(() => {
      setSession(prev => {
        if (!prev) return null
        const next = prev.timeLeft - TICK_MS / 1000
        if (next <= 0) {
          // Advance chord and reset timer
          const nextIdx = (prev.currentIndex + 1) % prev.chords.length
          const afterNextIdx = (nextIdx + 1) % prev.chords.length
          return {
            ...prev,
            currentIndex: nextIdx,
            nextIndex: afterNextIdx,
            timeLeft: prev.secondsPerChord,
          }
        }
        return { ...prev, timeLeft: next }
      })
    }, TICK_MS)

    return () => clearTimer()
  }, [session?.isRunning])

  const addChord = () => {
    const trimmed = newChord.trim()
    if (!trimmed || chords.includes(trimmed)) return
    setChords(prev => [...prev, trimmed])
    setNewChord('')
  }

  const removeChord = (chord: string) => {
    setChords(prev => prev.filter(c => c !== chord))
  }

  const resetSequence = () => {
    if (!session) return
    const shuffled = shuffleArray(chords)
    setSequence(shuffled)
    setSession(prev => prev ? {
      ...prev,
      chords: shuffled,
      currentIndex: 0,
      nextIndex: 1 % shuffled.length,
      timeLeft: secondsPerChord,
    } : null)
  }

  const currentChord = session ? sequence[session.currentIndex] : null
  const nextChord = session ? sequence[session.nextIndex] : null
  const progressPercent = session ? ((session.secondsPerChord - session.timeLeft) / session.secondsPerChord) * 100 : 0
  const totalAnswered = session ? session.score.hit + session.score.miss : 0
  const accuracy = totalAnswered > 0 && session ? Math.round((session.score.hit / totalAnswered) * 100) : null

  return (
    <div className="flex flex-col gap-6 p-6 bg-card rounded-lg border border-border">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">Chord Change Trainer</h3>
        {accuracy !== null && (
          <Badge variant="outline" className="text-sm">
            Accuracy: {accuracy}%
          </Badge>
        )}
      </div>

      {/* Chord selection */}
      {!session && (
        <>
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Chords (min 2)</Label>
            <div className="flex flex-wrap gap-2">
              {chords.map(c => (
                <Badge
                  key={c}
                  variant="secondary"
                  className="flex items-center gap-1 text-sm pr-1"
                >
                  {c}
                  <button
                    onClick={() => removeChord(c)}
                    className="ml-1 hover:text-destructive"
                    aria-label={`Remove ${c}`}
                  >
                    <X size={12} />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Add chord (e.g. Am7)"
                value={newChord}
                onChange={e => setNewChord(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addChord()}
                className="flex-1"
              />
              <Button onClick={addChord} size="sm" variant="outline" aria-label="Add chord">
                <Plus size={16} />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Seconds per chord</span>
              <span className="tabular-nums">{secondsPerChord}s</span>
            </div>
            <Slider
              min={1}
              max={16}
              step={1}
              value={[secondsPerChord]}
              onValueChange={([v]) => setSecondsPerChord(v)}
              aria-label="Seconds per chord"
            />
          </div>
        </>
      )}

      {/* Active session display */}
      {session && (
        <div className="space-y-4">
          {/* Progress bar */}
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-100"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Current chord */}
          <div className="text-center">
            <div className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Now</div>
            <div className="text-7xl font-bold text-primary tabular-nums">{currentChord}</div>
          </div>

          {/* Next chord */}
          <div className="text-center">
            <div className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Next</div>
            <div className="text-3xl font-semibold text-muted-foreground">{nextChord}</div>
          </div>

          {/* Hit / Miss buttons */}
          <div className="flex gap-3">
            <Button
              onClick={() => markResult(true)}
              className="flex-1 gap-2 bg-green-600 hover:bg-green-700 text-white"
              size="lg"
            >
              <Check size={18} />
              Hit
            </Button>
            <Button
              onClick={() => markResult(false)}
              className="flex-1 gap-2 bg-red-600 hover:bg-red-700 text-white"
              size="lg"
            >
              <X size={18} />
              Miss
            </Button>
          </div>

          {/* Score */}
          <div className="flex justify-center gap-6 text-sm">
            <span className="text-green-600 font-medium">✓ {session.score.hit}</span>
            <span className="text-red-500 font-medium">✗ {session.score.miss}</span>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex gap-2">
        {session ? (
          <>
            <Button onClick={stopSession} variant="destructive" className="flex-1 gap-2">
              <Stop size={16} />
              Stop
            </Button>
            <Button onClick={resetSequence} variant="outline" size="icon" aria-label="Shuffle sequence">
              <ArrowsClockwise size={16} />
            </Button>
          </>
        ) : (
          <Button
            onClick={startSession}
            disabled={chords.length < 2}
            className="flex-1 gap-2"
            size="lg"
          >
            <Play size={16} />
            Start
          </Button>
        )}
      </div>
    </div>
  )
}

