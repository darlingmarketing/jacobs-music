import type { ChordSegment, WorkerMessage, TranscriptionParams, ModelPrediction } from '@/types/transcription'
import { EnsembleModel } from '@/lib/chordModels'

const ESSENTIA_ENABLED =
  (import.meta as any).env?.VITE_ENABLE_ESSENTIA_ENGINE === "true";

interface RawChordFrame {
  t: number
  chord: string
  confidence: number
  modelVotes?: ModelPrediction[]
}

function postProgress(progress: number, step: string) {
  const msg: WorkerMessage = { type: 'progress', progress, step }
  self.postMessage(msg)
}

/**
 * Pure-JS fallback HPCP computation used when essentia.js is not enabled.
 * Uses sub-band RMS energy mapped to 12 pitch-class bins — fast and
 * sufficient for the JS EnsembleModel when Essentia is unavailable.
 */
function computeHPCP(frame: Float32Array, sampleRate: number): number[] {
  const hpcp = new Array<number>(12).fill(0)
  const n = frame.length
  const freqPerBin = sampleRate / n

  // Split the audible range (C2=65 Hz … C8=4186 Hz) into 12 pitch-class bands
  // based on equal-temperament centre frequencies.
  const A4 = 440
  const subBandSize = Math.max(1, Math.floor(n / 2 / 12))

  for (let pitchClass = 0; pitchClass < 12; pitchClass++) {
    // Centre frequency for this pitch class (relative to C = 0)
    const semitones = pitchClass - 9 // 0 = C, 9 = A
    const centreFreq = A4 * Math.pow(2, semitones / 12)
    const lowerFreq = centreFreq * Math.pow(2, -1 / 24)
    const upperFreq = centreFreq * Math.pow(2, 1 / 24)

    // Accumulate across all octaves (C2–C8)
    let energy = 0
    let count = 0
    for (let octave = -3; octave <= 3; octave++) {
      const lo = Math.max(1, Math.round((lowerFreq * Math.pow(2, octave)) / freqPerBin))
      const hi = Math.min(n / 2, Math.round((upperFreq * Math.pow(2, octave)) / freqPerBin))
      for (let k = lo; k <= hi; k++) {
        energy += frame[k] * frame[k]
        count++
      }
    }
    hpcp[pitchClass] = count > 0 ? Math.sqrt(energy / count) : 0
  }

  // Normalise to [0, 1]
  const max = Math.max(...hpcp, 1e-9)
  return hpcp.map(v => v / max)
}

function smoothChordSegments(
  frames: RawChordFrame[],
  minDurationMs: number,
  windowSize = 5
): RawChordFrame[] {
  if (frames.length === 0) return []
  
  const smoothed: RawChordFrame[] = []
  
  for (let i = 0; i < frames.length; i++) {
    const start = Math.max(0, i - Math.floor(windowSize / 2))
    const end = Math.min(frames.length, i + Math.ceil(windowSize / 2))
    const window = frames.slice(start, end)
    
    const chordScores = new Map<string, number>()
    window.forEach((f, idx) => {
      const distance = Math.abs(idx - (i - start))
      const weight = 1 / (1 + distance * 0.3)
      const currentScore = chordScores.get(f.chord) || 0
      chordScores.set(f.chord, currentScore + f.confidence * weight)
    })
    
    let maxScore = 0
    let bestChord = frames[i].chord
    chordScores.forEach((score, chord) => {
      if (score > maxScore) {
        maxScore = score
        bestChord = chord
      }
    })
    
    smoothed.push({ ...frames[i], chord: bestChord })
  }
  
  return smoothed
}

function mergeConsecutiveSegments(
  frames: RawChordFrame[],
  minDurationMs: number
): ChordSegment[] {
  if (frames.length === 0) return []
  
  const segments: ChordSegment[] = []
  let currentChord = frames[0].chord
  let startTime = frames[0].t
  let totalConfidence = frames[0].confidence
  let frameCount = 1
  let modelVotes = frames[0].modelVotes
  
  for (let i = 1; i < frames.length; i++) {
    if (frames[i].chord === currentChord) {
      totalConfidence += frames[i].confidence
      frameCount++
    } else {
      const endTime = frames[i].t
      const duration = endTime - startTime
      
      if (duration >= minDurationMs) {
        segments.push({
          id: crypto.randomUUID(),
          startMs: startTime,
          endMs: endTime,
          chord: currentChord,
          confidence: totalConfidence / frameCount,
          modelVotes
        })
      }
      
      currentChord = frames[i].chord
      startTime = frames[i].t
      totalConfidence = frames[i].confidence
      frameCount = 1
      modelVotes = frames[i].modelVotes
    }
  }
  
  segments.push({
    id: crypto.randomUUID(),
    startMs: startTime,
    endMs: frames[frames.length - 1].t + 100,
    chord: currentChord,
    confidence: totalConfidence / frameCount,
    modelVotes
  })
  
  const merged: ChordSegment[] = []
  for (let i = 0; i < segments.length; i++) {
    if (segments[i].endMs - segments[i].startMs >= minDurationMs) {
      merged.push(segments[i])
    } else if (merged.length > 0) {
      merged[merged.length - 1].endMs = segments[i].endMs
    }
  }
  
  return merged
}

self.onmessage = async (e: MessageEvent) => {
  const { audioData, sampleRate, params } = e.data as {
    audioData: Float32Array
    sampleRate: number
    params: TranscriptionParams
  }
  
  try {
    postProgress(5, 'Initializing AI Models...')
    
    // Dynamically import essentia only when the feature flag is enabled.
    // This keeps the worker compilable even without essentia.js installed.
    let essentia: any = null
    if (ESSENTIA_ENABLED) {
      const EssentiaModule = await import('essentia.js').then(m => (m as any).default ?? m)
      essentia = new EssentiaModule()
    }

    const ensembleModel = new EnsembleModel()
    const useEnsemble = params.enableEnsemble !== false
    
    postProgress(10, 'Computing spectral features...')
    
    const frameSize = params.frameSize || 4096
    const hopSize = params.hopSize || 2048
    const numFrames = Math.floor((audioData.length - frameSize) / hopSize)
    
    const frames: RawChordFrame[] = []
    
    for (let i = 0; i < numFrames; i++) {
      if (i % 50 === 0) {
        const progress = 10 + ((i / numFrames) * 60)
        postProgress(progress, `Analyzing frame ${i + 1}/${numFrames} with AI models...`)
      }
      
      const frameStart = i * hopSize
      const frame = audioData.slice(frameStart, frameStart + frameSize)

      let hpcpArray: number[]
      if (essentia) {
        const spectrum = essentia.Spectrum(essentia.arrayToVector(frame))
        const peaks = essentia.SpectralPeaks(spectrum.spectrum)
        const hpcp = essentia.HPCP(peaks.frequencies, peaks.magnitudes)
        hpcpArray = Array.from(essentia.vectorToArray(hpcp.hpcp) as unknown as number[])
      } else {
        hpcpArray = computeHPCP(frame, sampleRate)
      }
      
      let chord: string
      let confidence: number
      let modelVotes: ModelPrediction[] | undefined
      
      if (useEnsemble) {
        const result = ensembleModel.predict(hpcpArray)
        chord = result.chord
        confidence = result.confidence
        modelVotes = result.modelVotes
      } else {
        const predictions = ensembleModel.getPredictions(hpcpArray)
        const best = predictions.reduce((a, b) => a.confidence > b.confidence ? a : b)
        chord = best.chord
        confidence = best.confidence
        modelVotes = predictions
      }
      
      const timeMs = (frameStart / sampleRate) * 1000
      frames.push({ t: timeMs, chord, confidence, modelVotes })
    }
    
    postProgress(75, 'Smoothing chord transitions...')
    const smoothed = smoothChordSegments(frames, params.minSegmentDurationMs)
    
    postProgress(85, 'Merging segments...')
    const segments = mergeConsecutiveSegments(smoothed, params.minSegmentDurationMs)
    
    postProgress(95, 'Finalizing...')
    
    const filtered = segments.filter(s => 
      !s.confidence || s.confidence >= params.confidenceThreshold
    )
    
    postProgress(100, 'Complete')
    
    const msg: WorkerMessage = {
      type: 'success',
      segments: filtered
    }
    self.postMessage(msg)
    
  } catch (error) {
    const msg: WorkerMessage = {
      type: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
    self.postMessage(msg)
  }
}
