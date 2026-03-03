import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Microphone, MicrophoneSlash } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const A4_FREQ = 440
const A4_MIDI = 69
const MIN_RMS_THRESHOLD = 0.01
const NEAREST_STRING_THRESHOLD_HZ = 15

function freqToNote(frequency: number): { note: string; octave: number; cents: number; midi: number } {
  const midi = 12 * (Math.log2(frequency / A4_FREQ)) + A4_MIDI
  const roundedMidi = Math.round(midi)
  const cents = Math.round((midi - roundedMidi) * 100)
  const noteIndex = ((roundedMidi % 12) + 12) % 12
  const octave = Math.floor(roundedMidi / 12) - 1
  return { note: NOTE_NAMES[noteIndex], octave, cents, midi: roundedMidi }
}

// Autocorrelation-based pitch detection
function detectPitch(buffer: Float32Array, sampleRate: number): number | null {
  const SIZE = buffer.length
  const MAX_SAMPLES = Math.floor(SIZE / 2)
  let bestOffset = -1
  let bestCorrelation = 0
  let rms = 0

  for (let i = 0; i < SIZE; i++) {
    rms += buffer[i] * buffer[i]
  }
  rms = Math.sqrt(rms / SIZE)

  if (rms < MIN_RMS_THRESHOLD) return null

  let lastCorrelation = 1
  for (let offset = 1; offset < MAX_SAMPLES; offset++) {
    let correlation = 0
    for (let i = 0; i < MAX_SAMPLES; i++) {
      correlation += Math.abs(buffer[i] - buffer[i + offset])
    }
    correlation = 1 - correlation / MAX_SAMPLES
    if (correlation > 0.9 && correlation > lastCorrelation) {
      if (bestCorrelation < correlation) {
        bestCorrelation = correlation
        bestOffset = offset
      }
    }
    lastCorrelation = correlation
  }

  if (bestOffset === -1) return null

  return sampleRate / bestOffset
}

export function Tuner() {
  const [isListening, setIsListening] = useState(false)
  const [frequency, setFrequency] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animFrameRef = useRef<number | null>(null)

  const analyse = useCallback(() => {
    const analyser = analyserRef.current
    if (!analyser) return

    const buffer = new Float32Array(analyser.fftSize)
    analyser.getFloatTimeDomainData(buffer)

    const sampleRate = audioContextRef.current?.sampleRate ?? 44100
    const pitch = detectPitch(buffer, sampleRate)
    setFrequency(pitch)

    animFrameRef.current = requestAnimationFrame(analyse)
  }, [])

  const startListening = useCallback(async () => {
    try {
      setError(null)
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      streamRef.current = stream

      const ctx = new AudioContext()
      audioContextRef.current = ctx

      const analyser = ctx.createAnalyser()
      analyser.fftSize = 2048
      analyserRef.current = analyser

      const source = ctx.createMediaStreamSource(stream)
      source.connect(analyser)

      setIsListening(true)
      animFrameRef.current = requestAnimationFrame(analyse)
    } catch (err) {
      setError('Microphone access denied. Please allow microphone access and try again.')
    }
  }, [analyse])

  const stopListening = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current)
      animFrameRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }
    analyserRef.current = null
    setIsListening(false)
    setFrequency(null)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopListening()
    }
  }, [stopListening])

  const detected = frequency !== null ? freqToNote(frequency) : null
  const cents = detected?.cents ?? 0
  // Clamp cents display to ±50 for the meter
  const meterPercent = Math.min(100, Math.max(0, ((cents + 50) / 100) * 100))
  const inTune = Math.abs(cents) <= 5

  return (
    <div className="flex flex-col gap-6 p-6 bg-card rounded-lg border border-border">
      <div className="text-center space-y-1">
        {detected ? (
          <>
            <div className="text-5xl font-bold tracking-tight">
              {detected.note}
              <span className="text-2xl text-muted-foreground">{detected.octave}</span>
            </div>
            <div className="text-sm text-muted-foreground">
              {frequency!.toFixed(1)} Hz
            </div>
          </>
        ) : (
          <div className="text-3xl font-semibold text-muted-foreground py-3">
            {isListening ? 'Listening…' : 'Start the tuner to detect pitch'}
          </div>
        )}
      </div>

      {/* Pitch deviation meter */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>♭ Flat</span>
          <span className={cn('font-medium', inTune ? 'text-green-500' : 'text-yellow-500')}>
            {detected ? (cents === 0 ? 'In tune' : `${cents > 0 ? '+' : ''}${cents} cents`) : '—'}
          </span>
          <span>Sharp ♯</span>
        </div>
        <div className="relative h-4 bg-secondary rounded-full overflow-hidden">
          {/* Centre line */}
          <div className="absolute inset-y-0 left-1/2 w-0.5 bg-border -translate-x-1/2 z-10" />
          {/* Indicator */}
          {detected && (
            <div
              className={cn(
                'absolute top-1 h-2 w-2 rounded-full -translate-x-1/2 transition-all duration-150',
                inTune ? 'bg-green-500' : 'bg-yellow-500'
              )}
              style={{ left: `${meterPercent}%` }}
            />
          )}
        </div>
      </div>

      {/* Standard guitar tuning reference */}
      <div className="grid grid-cols-6 gap-1 text-center">
        {[
          { string: 'E2', freq: 82.41 },
          { string: 'A2', freq: 110.0 },
          { string: 'D3', freq: 146.83 },
          { string: 'G3', freq: 196.0 },
          { string: 'B3', freq: 246.94 },
          { string: 'E4', freq: 329.63 },
        ].map(s => {
          const isNearest =
            frequency !== null && Math.abs(frequency - s.freq) < NEAREST_STRING_THRESHOLD_HZ
          return (
            <div
              key={s.string}
              className={cn(
                'rounded py-1 text-xs font-medium border',
                isNearest
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border text-muted-foreground'
              )}
            >
              {s.string}
            </div>
          )
        })}
      </div>

      {error && (
        <p className="text-sm text-destructive text-center">{error}</p>
      )}

      <Button
        onClick={isListening ? stopListening : startListening}
        className="w-full gap-2"
        variant={isListening ? 'destructive' : 'default'}
        size="lg"
      >
        {isListening ? (
          <>
            <MicrophoneSlash size={20} />
            Stop Tuner
          </>
        ) : (
          <>
            <Microphone size={20} />
            Start Tuner
          </>
        )}
      </Button>
    </div>
  )
}
