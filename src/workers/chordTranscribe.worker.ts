import Essentia from 'essentia.js'
import type { ChordSegment, WorkerMessage, TranscriptionParams } from '@/types/transcription'

const CHORD_LABELS = [
  'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B',
  'Cm', 'C#m', 'Dm', 'D#m', 'Em', 'Fm', 'F#m', 'Gm', 'G#m', 'Am', 'A#m', 'Bm'
]

interface RawChordFrame {
  t: number
  chord: string
  confidence: number
}

function postProgress(progress: number, step: string) {
  const msg: WorkerMessage = { type: 'progress', progress, step }
  self.postMessage(msg)
}

function smoothChordSegments(
  frames: RawChordFrame[],
  minDurationMs: number,
  windowSize = 3
): RawChordFrame[] {
  if (frames.length === 0) return []
  
  const smoothed: RawChordFrame[] = []
  
  for (let i = 0; i < frames.length; i++) {
    const start = Math.max(0, i - Math.floor(windowSize / 2))
    const end = Math.min(frames.length, i + Math.ceil(windowSize / 2))
    const window = frames.slice(start, end)
    
    const chordCounts = new Map<string, number>()
    window.forEach(f => {
      chordCounts.set(f.chord, (chordCounts.get(f.chord) || 0) + 1)
    })
    
    let maxCount = 0
    let majorityChord = frames[i].chord
    chordCounts.forEach((count, chord) => {
      if (count > maxCount) {
        maxCount = count
        majorityChord = chord
      }
    })
    
    smoothed.push({ ...frames[i], chord: majorityChord })
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
          confidence: totalConfidence / frameCount
        })
      }
      
      currentChord = frames[i].chord
      startTime = frames[i].t
      totalConfidence = frames[i].confidence
      frameCount = 1
    }
  }
  
  segments.push({
    id: crypto.randomUUID(),
    startMs: startTime,
    endMs: frames[frames.length - 1].t + 100,
    chord: currentChord,
    confidence: totalConfidence / frameCount
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

function simpleMajorMinorDetection(hpcp: number[]): { chord: string; confidence: number } {
  const majorProfile = [1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0]
  const minorProfile = [1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0]
  
  let bestChord = 'N.C.'
  let bestScore = -1
  
  for (let root = 0; root < 12; root++) {
    const majorScore = majorProfile.reduce((sum, val, i) => {
      return sum + val * hpcp[(i + root) % 12]
    }, 0)
    
    const minorScore = minorProfile.reduce((sum, val, i) => {
      return sum + val * hpcp[(i + root) % 12]
    }, 0)
    
    if (majorScore > bestScore) {
      bestScore = majorScore
      bestChord = CHORD_LABELS[root]
    }
    
    if (minorScore > bestScore) {
      bestScore = minorScore
      bestChord = CHORD_LABELS[root + 12]
    }
  }
  
  const hpcpMag = Math.sqrt(hpcp.reduce((sum, v) => sum + v * v, 0))
  const confidence = hpcpMag > 0 ? Math.min(1, bestScore / hpcpMag) : 0
  
  return { chord: bestChord, confidence }
}

self.onmessage = async (e: MessageEvent) => {
  const { audioData, sampleRate, params } = e.data as {
    audioData: Float32Array
    sampleRate: number
    params: TranscriptionParams
  }
  
  try {
    postProgress(5, 'Initializing Essentia.js...')
    
    const essentia = new Essentia()
    
    postProgress(10, 'Computing HPCP features...')
    
    const frameSize = params.frameSize || 4096
    const hopSize = params.hopSize || 2048
    const numFrames = Math.floor((audioData.length - frameSize) / hopSize)
    
    const frames: RawChordFrame[] = []
    
    for (let i = 0; i < numFrames; i++) {
      if (i % 50 === 0) {
        const progress = 10 + ((i / numFrames) * 60)
        postProgress(progress, `Processing frame ${i + 1}/${numFrames}`)
      }
      
      const frameStart = i * hopSize
      const frame = audioData.slice(frameStart, frameStart + frameSize)
      
      const spectrum = essentia.Spectrum(essentia.arrayToVector(frame))
      const peaks = essentia.SpectralPeaks(spectrum.spectrum)
      
      const hpcp = essentia.HPCP(peaks.frequencies, peaks.magnitudes)
      const hpcpArray = Array.from(essentia.vectorToArray(hpcp.hpcp))
      
      const { chord, confidence } = simpleMajorMinorDetection(hpcpArray)
      
      const timeMs = (frameStart / sampleRate) * 1000
      frames.push({ t: timeMs, chord, confidence })
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
