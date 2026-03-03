export interface ChordSegment {
  startMs: n
  startMs: number
  endMs: number
}
  confidence?: number
 

  segments: ChordSegment[]
  createdAt:

  frameSize: number
  sampleRate: number
  minSegmentDurationMs: number
}
export interface Worke
  segments: ChordSegment[]
  error?: string
  createdAt: string
}

export interface TranscriptionParams {
  frameSize: number
  hopSize: number
  sampleRate: number
  beatAware: boolean
  minSegmentDurationMs: number
  confidenceThreshold: number
}

export interface WorkerMessage {
  type: 'progress' | 'success' | 'error'

  step?: string
  segments?: ChordSegment[]
  error?: string

