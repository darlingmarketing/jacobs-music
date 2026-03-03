export type ChordQuality = 'major' | 'minor' | '7' | 'maj7' | 'min7' | 'sus2' | 'sus4' | 'dim' | 'aug'

export interface ChordProfile {
  root: number
  quality: ChordQuality
  intervals: number[]
  weights: number[]
  name: string
}

export const CHORD_ROOTS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

export const CHORD_TEMPLATES: Record<ChordQuality, { intervals: number[], weights: number[] }> = {
  major: {
    intervals: [0, 4, 7],
    weights: [1.0, 0.8, 0.9]
  },
  minor: {
    intervals: [0, 3, 7],
    weights: [1.0, 0.8, 0.9]
  },
  '7': {
    intervals: [0, 4, 7, 10],
    weights: [1.0, 0.75, 0.85, 0.7]
  },
  maj7: {
    intervals: [0, 4, 7, 11],
    weights: [1.0, 0.75, 0.85, 0.7]
  },
  min7: {
    intervals: [0, 3, 7, 10],
    weights: [1.0, 0.75, 0.85, 0.7]
  },
  sus2: {
    intervals: [0, 2, 7],
    weights: [1.0, 0.75, 0.9]
  },
  sus4: {
    intervals: [0, 5, 7],
    weights: [1.0, 0.75, 0.9]
  },
  dim: {
    intervals: [0, 3, 6],
    weights: [1.0, 0.8, 0.85]
  },
  aug: {
    intervals: [0, 4, 8],
    weights: [1.0, 0.8, 0.85]
  }
}

export function generateChordProfiles(): ChordProfile[] {
  const profiles: ChordProfile[] = []
  
  for (let root = 0; root < 12; root++) {
    for (const [quality, template] of Object.entries(CHORD_TEMPLATES)) {
      const name = formatChordName(root, quality as ChordQuality)
      profiles.push({
        root,
        quality: quality as ChordQuality,
        intervals: template.intervals,
        weights: template.weights,
        name
      })
    }
  }
  
  return profiles
}

export function formatChordName(root: number, quality: ChordQuality): string {
  const rootName = CHORD_ROOTS[root]
  
  switch (quality) {
    case 'major':
      return rootName
    case 'minor':
      return `${rootName}m`
    case '7':
      return `${rootName}7`
    case 'maj7':
      return `${rootName}maj7`
    case 'min7':
      return `${rootName}m7`
    case 'sus2':
      return `${rootName}sus2`
    case 'sus4':
      return `${rootName}sus4`
    case 'dim':
      return `${rootName}dim`
    case 'aug':
      return `${rootName}aug`
    default:
      return rootName
  }
}

export interface ModelPrediction {
  chord: string
  confidence: number
  modelId: string
  features?: Record<string, number>
}

export class HPCPPatternModel {
  private profiles: ChordProfile[]
  
  constructor() {
    this.profiles = generateChordProfiles()
  }
  
  predict(hpcp: number[]): ModelPrediction {
    let bestChord = 'N.C.'
    let bestScore = -1
    let bestFeatures = {}
    
    for (const profile of this.profiles) {
      let score = 0
      
      for (let i = 0; i < profile.intervals.length; i++) {
        const pitchClass = (profile.root + profile.intervals[i]) % 12
        score += hpcp[pitchClass] * profile.weights[i]
      }
      
      const hpcpMag = Math.sqrt(hpcp.reduce((sum, v) => sum + v * v, 0))
      const normalizedScore = hpcpMag > 0 ? score / hpcpMag : 0
      
      if (normalizedScore > bestScore) {
        bestScore = normalizedScore
        bestChord = profile.name
        bestFeatures = {
          rawScore: score,
          normalizedScore,
          hpcpMagnitude: hpcpMag
        }
      }
    }
    
    return {
      chord: bestChord,
      confidence: Math.min(1, Math.max(0, bestScore * 1.2)),
      modelId: 'hpcp-pattern',
      features: bestFeatures
    }
  }
}

export class HarmonicSpectrumModel {
  private profiles: ChordProfile[]
  
  constructor() {
    this.profiles = generateChordProfiles()
  }
  
  predict(hpcp: number[]): ModelPrediction {
    const harmonicStrength = this.calculateHarmonicStrength(hpcp)
    
    let bestChord = 'N.C.'
    let bestScore = -1
    
    for (const profile of this.profiles) {
      let score = 0
      let totalWeight = 0
      
      for (let i = 0; i < profile.intervals.length; i++) {
        const pitchClass = (profile.root + profile.intervals[i]) % 12
        const harmonic = harmonicStrength[pitchClass]
        score += harmonic * profile.weights[i]
        totalWeight += profile.weights[i]
      }
      
      const avgScore = totalWeight > 0 ? score / totalWeight : 0
      
      if (avgScore > bestScore) {
        bestScore = avgScore
        bestChord = profile.name
      }
    }
    
    return {
      chord: bestChord,
      confidence: Math.min(1, Math.max(0, bestScore)),
      modelId: 'harmonic-spectrum'
    }
  }
  
  private calculateHarmonicStrength(hpcp: number[]): number[] {
    const strength = new Array(12).fill(0)
    
    for (let i = 0; i < 12; i++) {
      strength[i] = hpcp[i]
      
      const fifth = (i + 7) % 12
      const octave = i
      
      if (hpcp[fifth] > 0.3) {
        strength[i] += hpcp[fifth] * 0.4
      }
      
      strength[i] = Math.min(1, strength[i])
    }
    
    return strength
  }
}

export class NeuralNetworkSimulator {
  private profiles: ChordProfile[]
  private weights: number[][]
  
  constructor() {
    this.profiles = generateChordProfiles()
    this.weights = this.initializeWeights()
  }
  
  private initializeWeights(): number[][] {
    const inputSize = 12
    const hiddenSize = 24
    const outputSize = this.profiles.length
    
    const w1: number[][] = []
    for (let i = 0; i < hiddenSize; i++) {
      w1[i] = []
      for (let j = 0; j < inputSize; j++) {
        w1[i][j] = (Math.random() - 0.5) * 0.5
      }
    }
    
    return w1
  }
  
  predict(hpcp: number[]): ModelPrediction {
    const hiddenSize = 24
    const hidden = new Array(hiddenSize).fill(0)
    
    for (let i = 0; i < hiddenSize; i++) {
      let sum = 0
      for (let j = 0; j < 12; j++) {
        sum += hpcp[j] * this.weights[i][j]
      }
      hidden[i] = this.relu(sum)
    }
    
    const scores: number[] = []
    for (const profile of this.profiles) {
      let score = 0
      for (let i = 0; i < profile.intervals.length; i++) {
        const pitchClass = (profile.root + profile.intervals[i]) % 12
        const hiddenIdx = pitchClass * 2
        if (hiddenIdx < hiddenSize) {
          score += hidden[hiddenIdx] * profile.weights[i]
        }
      }
      scores.push(score)
    }
    
    const maxScore = Math.max(...scores)
    const expScores = scores.map(s => Math.exp(s - maxScore))
    const sumExp = expScores.reduce((a, b) => a + b, 0)
    const probabilities = expScores.map(s => s / sumExp)
    
    let bestIdx = 0
    let bestProb = probabilities[0]
    for (let i = 1; i < probabilities.length; i++) {
      if (probabilities[i] > bestProb) {
        bestProb = probabilities[i]
        bestIdx = i
      }
    }
    
    return {
      chord: this.profiles[bestIdx].name,
      confidence: bestProb,
      modelId: 'neural-net'
    }
  }
  
  private relu(x: number): number {
    return Math.max(0, x)
  }
}

export class EnsembleModel {
  private hpcpModel: HPCPPatternModel
  private harmonicModel: HarmonicSpectrumModel
  private neuralModel: NeuralNetworkSimulator
  
  constructor() {
    this.hpcpModel = new HPCPPatternModel()
    this.harmonicModel = new HarmonicSpectrumModel()
    this.neuralModel = new NeuralNetworkSimulator()
  }
  
  predict(hpcp: number[]): { chord: string; confidence: number; modelVotes: ModelPrediction[] } {
    const predictions = [
      this.hpcpModel.predict(hpcp),
      this.harmonicModel.predict(hpcp),
      this.neuralModel.predict(hpcp)
    ]
    
    const weights = {
      'hpcp-pattern': 0.40,
      'harmonic-spectrum': 0.35,
      'neural-net': 0.25
    }
    
    const chordScores = new Map<string, number>()
    
    for (const pred of predictions) {
      const weight = weights[pred.modelId as keyof typeof weights] || 0.33
      const weightedScore = pred.confidence * weight
      const currentScore = chordScores.get(pred.chord) || 0
      chordScores.set(pred.chord, currentScore + weightedScore)
    }
    
    let bestChord = 'N.C.'
    let bestScore = -1
    
    for (const [chord, score] of chordScores.entries()) {
      if (score > bestScore) {
        bestScore = score
        bestChord = chord
      }
    }
    
    return {
      chord: bestChord,
      confidence: Math.min(1, bestScore),
      modelVotes: predictions
    }
  }
  
  getPredictions(hpcp: number[]): ModelPrediction[] {
    return [
      this.hpcpModel.predict(hpcp),
      this.harmonicModel.predict(hpcp),
      this.neuralModel.predict(hpcp)
    ]
  }
}
