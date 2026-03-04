import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Microphone, MicrophoneSlash } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const A4_FREQ = 440
const A4_MIDI = 69
const DEFAULT_SENSITIVITY = 0.01
const SENSITIVITY_HIGH_THRESHOLD = 0.005
const SENSITIVITY_MEDIUM_THRESHOLD = 0.02
const NEAREST_STRING_THRESHOLD_HZ = 15

interface StringRef {
  label: string
  freq: number
}

interface TuningPreset {
  name: string
  strings: StringRef[]
}

const TUNING_PRESETS: TuningPreset[] = [
  {
    name: 'E Standard (EADGBe)',
    strings: [
      { label: 'E2', freq: 82.41 },
      { label: 'A2', freq: 110.0 },
      { label: 'D3', freq: 146.83 },
      { label: 'G3', freq: 196.0 },
      { label: 'B3', freq: 246.94 },
      { label: 'E4', freq: 329.63 },
    ],
  },
  {
    name: 'Drop D (DADGBe)',
    strings: [
      { label: 'D2', freq: 73.42 },
      { label: 'A2', freq: 110.0 },
      { label: 'D3', freq: 146.83 },
      { label: 'G3', freq: 196.0 },
      { label: 'B3', freq: 246.94 },
      { label: 'E4', freq: 329.63 },
    ],
  },
  {
    name: 'D Standard (DGCFAd)',
    strings: [
      { label: 'D2', freq: 73.42 },
      { label: 'G2', freq: 98.0 },
      { label: 'C3', freq: 130.81 },
      { label: 'F3', freq: 174.61 },
      { label: 'A3', freq: 220.0 },
      { label: 'D4', freq: 293.66 },
    ],
  },
  {
    name: 'Open G (DGDGBd)',
    strings: [
      { label: 'D2', freq: 73.42 },
      { label: 'G2', freq: 98.0 },
      { label: 'D3', freq: 146.83 },
      { label: 'G3', freq: 196.0 },
      { label: 'B3', freq: 246.94 },
      { label: 'D4', freq: 293.66 },
    ],
  },
  {
    name: 'Open D (DADf#Ad)',
    strings: [
      { label: 'D2', freq: 73.42 },
      { label: 'A2', freq: 110.0 },
      { label: 'D3', freq: 146.83 },
      { label: 'F#3', freq: 185.0 },
      { label: 'A3', freq: 220.0 },
      { label: 'D4', freq: 293.66 },
    ],
  },
  {
    name: 'Half Step Down (Eb)',
    strings: [
      { label: 'Eb2', freq: 77.78 },
      { label: 'Ab2', freq: 103.83 },
      { label: 'Db3', freq: 138.59 },
      { label: 'Gb3', freq: 185.0 },
      { label: 'Bb3', freq: 233.08 },
      { label: 'Eb4', freq: 311.13 },
    ],
  },
]

function freqToNote(frequency: number): { note: string; octave: number; cents: number; midi: number } {
  const midi = 12 * (Math.log2(frequency / A4_FREQ)) + A4_MIDI
  const roundedMidi = Math.round(midi)
  const cents = Math.round((midi - roundedMidi) * 100)
  const noteIndex = ((roundedMidi % 12) + 12) % 12
  const octave = Math.floor(roundedMidi / 12) - 1
  return { note: NOTE_NAMES[noteIndex], octave, cents, midi: roundedMidi }
}

// Autocorrelation-based pitch detection
function detectPitch(buffer: Float32Array, sampleRate: number, minRmsThreshold: number): number | null {
  const SIZE = buffer.length
  const MAX_SAMPLES = Math.floor(SIZE / 2)
  let bestOffset = -1
  let bestCorrelation = 0
  let rms = 0

  for (let i = 0; i < SIZE; i++) {
    rms += buffer[i] * buffer[i]
  }
  rms = Math.sqrt(rms / SIZE)

  if (rms < minRmsThreshold) return null

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
  const [sensitivity, setSensitivity] = useState(DEFAULT_SENSITIVITY)
  const [error, setError] = useState<string | null>(null)
  const [tuningPreset, setTuningPreset] = useState<TuningPreset>(TUNING_PRESETS[0])

  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animFrameRef = useRef<number | null>(null)

  const sensitivityRef = useRef(sensitivity)
  useEffect(() => { sensitivityRef.current = sensitivity }, [sensitivity])

  const analyse = useCallback(() => {
    const analyser = analyserRef.current
    if (!analyser) return

    const buffer = new Float32Array(analyser.fftSize)
    analyser.getFloatTimeDomainData(buffer)

    const sampleRate = audioContextRef.current?.sampleRate ?? 44100
    const pitch = detectPitch(buffer, sampleRate, sensitivityRef.current)
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
      {/* Tuning preset selector */}
      <div className="space-y-1">
        <Label className="text-sm text-muted-foreground">Tuning</Label>
        <Select
          value={tuningPreset.name}
          onValueChange={name => {
            const preset = TUNING_PRESETS.find(p => p.name === name)
            if (preset) setTuningPreset(preset)
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TUNING_PRESETS.map(p => (
              <SelectItem key={p.name} value={p.name}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

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

      {/* String reference for selected tuning */}
      <div className="grid gap-1 text-center" style={{ gridTemplateColumns: `repeat(${tuningPreset.strings.length}, minmax(0, 1fr))` }}>
        {tuningPreset.strings.map(s => {
          const isNearest =
            frequency !== null && Math.abs(frequency - s.freq) < NEAREST_STRING_THRESHOLD_HZ
          return (
            <div
              key={s.label}
              className={cn(
                'rounded py-1 text-xs font-medium border',
                isNearest
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border text-muted-foreground'
              )}
            >
              {s.label}
            </div>
          )
        })}
      </div>

      {error && (
        <p className="text-sm text-destructive text-center">{error}</p>
      )}

      {/* Sensitivity control */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <Label className="text-xs text-muted-foreground">Sensitivity</Label>
          <span>{sensitivity < SENSITIVITY_HIGH_THRESHOLD ? 'High' : sensitivity < SENSITIVITY_MEDIUM_THRESHOLD ? 'Medium' : 'Low'}</span>
        </div>
        <Slider
          min={0.001}
          max={0.05}
          step={0.001}
          value={[sensitivity]}
          onValueChange={([v]) => setSensitivity(v)}
          aria-label="Tuner sensitivity"
        />
      </div>

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
