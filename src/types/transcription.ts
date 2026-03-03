export interface ChordSegment {
  id: string
  startMs: number
  endMs: number
  chord: string
  confidence?: number
  modelVotes?: ModelPrediction[]
}

export interface ModelPrediction {
  chord: string
  confidence: number
  modelId: string
  features?: Record<string, number>
}

export interface TranscriptionParams {
  frameSize: number
  hopSize: number
  sampleRate: number
  beatAware: boolean
  minSegmentDurationMs: number
  confidenceThreshold: number
  detectionMode?: 'fast' | 'balanced' | 'accurate'
  enableEnsemble?: boolean
}

export interface WorkerMessage {
  type: 'progress' | 'success' | 'error'
  progress?: number
  step?: string
  segments?: ChordSegment[]
  error?: string
}
