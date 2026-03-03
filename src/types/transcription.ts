export interface ChordSegment {
  id: string
  startMs: number
  endMs: number
  chord: string
  confidence?: number
}

export interface TranscriptionJob {
  id: string
  audioFileName?: string
  audioDurationMs?: number
  audioSampleRate?: number
  status: 'idle' | 'processing' | 'success' | 'error' | 'cancelled'
  progress: number
  progressStep: string
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
  progress?: number
  step?: string
  segments?: ChordSegment[]
  error?: string
}
