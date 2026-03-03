import type { ChordSegment } from '@/types/transcription'
import type { Song, Section, Block } from '@/types'

export interface ConversionOptions {
  bpm: number
  timeSig: string
  mode: 'bar' | 'sectioned'
}

export function msToBeats(ms: number, bpm: number): number {
  return (ms / 1000) * (bpm / 60)
}

export function beatsToMs(beats: number, bpm: number): number {
  return (beats / (bpm / 60)) * 1000
}

export function getMeasureDurationMs(bpm: number, timeSig: string): number {
  const [beatsPerMeasure] = timeSig.split('/').map(Number)
  return beatsToMs(beatsPerMeasure, bpm)
}

export function segmentsToBars(
  segments: ChordSegment[],
  bpm: number,
  timeSig: string
): string {
  if (segments.length === 0) return '| N.C. |'
  
  const measureDurationMs = getMeasureDurationMs(bpm, timeSig)
  const totalDurationMs = Math.max(...segments.map(s => s.endMs))
  const numMeasures = Math.ceil(totalDurationMs / measureDurationMs)
  
  const measures: string[] = []
  
  for (let i = 0; i < numMeasures; i++) {
    const measureStartMs = i * measureDurationMs
    const measureEndMs = (i + 1) * measureDurationMs
    
    const overlappingSegments = segments.filter(seg => 
      seg.startMs < measureEndMs && seg.endMs > measureStartMs
    )
    
    if (overlappingSegments.length === 0) {
      measures.push('N.C.')
      continue
    }
    
    let maxOverlap = 0
    let dominantChord = 'N.C.'
    
    overlappingSegments.forEach(seg => {
      const overlapStart = Math.max(seg.startMs, measureStartMs)
      const overlapEnd = Math.min(seg.endMs, measureEndMs)
      const overlap = overlapEnd - overlapStart
      
      if (overlap > maxOverlap) {
        maxOverlap = overlap
        dominantChord = seg.chord
      }
    })
    
    measures.push(dominantChord)
  }
  
  const lines: string[] = []
  for (let i = 0; i < measures.length; i += 4) {
    const chunk = measures.slice(i, i + 4)
    lines.push('| ' + chunk.join(' | ') + ' |')
  }
  
  return lines.join('\n')
}

function detectRepeatedPatterns(segments: ChordSegment[]): ChordSegment[][] {
  const MIN_PATTERN_LENGTH = 4
  const patterns: ChordSegment[][] = []
  
  if (segments.length < MIN_PATTERN_LENGTH) {
    return [segments]
  }
  
  let currentPattern: ChordSegment[] = []
  
  for (let i = 0; i < segments.length; i++) {
    currentPattern.push(segments[i])
    
    if (currentPattern.length >= 8) {
      patterns.push([...currentPattern])
      currentPattern = []
    }
  }
  
  if (currentPattern.length > 0) {
    patterns.push(currentPattern)
  }
  
  return patterns.length > 0 ? patterns : [segments]
}

export function segmentsToSections(
  segments: ChordSegment[],
  bpm: number,
  timeSig: string
): Section[] {
  const patterns = detectRepeatedPatterns(segments)
  const sections: Section[] = []
  
  const sectionNames = ['Verse', 'Chorus', 'Bridge', 'Outro']
  
  patterns.forEach((pattern, index) => {
    const chordContent = segmentsToBars(pattern, bpm, timeSig)
    const sectionName = index < sectionNames.length 
      ? sectionNames[index] 
      : `Section ${index + 1}`
    
    const blocks: Block[] = [
      {
        id: crypto.randomUUID(),
        type: 'chords',
        content: chordContent
      }
    ]
    
    sections.push({
      id: crypto.randomUUID(),
      name: sectionName,
      type: index === 1 ? 'chorus' : index === 2 ? 'bridge' : 'verse',
      order: index,
      blocks
    })
  })
  
  return sections
}

export function convertSegmentsToSong(
  segments: ChordSegment[],
  options: ConversionOptions,
  songMetadata: Partial<Song>
): Omit<Song, 'id' | 'userId' | 'createdAt' | 'updatedAt'> {
  const sections = options.mode === 'sectioned' 
    ? segmentsToSections(segments, options.bpm, options.timeSig)
    : [
        {
          id: crypto.randomUUID(),
          name: 'Transcribed',
          type: 'custom' as const,
          order: 0,
          blocks: [
            {
              id: crypto.randomUUID(),
              type: 'chords' as const,
              content: segmentsToBars(segments, options.bpm, options.timeSig)
            },
            {
              id: crypto.randomUUID(),
              type: 'note' as const,
              content: 'Generated from audio transcription. Review and edit chord accuracy.'
            }
          ]
        }
      ]
  
  return {
    title: songMetadata.title || 'Untitled Transcription',
    description: songMetadata.description,
    artist: songMetadata.artist,
    key: songMetadata.key,
    tempo: options.bpm,
    timeSignature: options.timeSig,
    capo: songMetadata.capo || 0,
    tuning: songMetadata.tuning || 'Standard',
    difficulty: songMetadata.difficulty,
    tags: songMetadata.tags || ['transcribed'],
    sections
  }
}

export function transposeChord(chord: string, semitones: number): string {
  if (chord === 'N.C.') return chord
  
  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
  const match = chord.match(/^([A-G]#?)(.*)$/)
  
  if (!match) return chord
  
  const [, root, suffix] = match
  const rootIndex = notes.indexOf(root)
  
  if (rootIndex === -1) return chord
  
  const newIndex = (rootIndex + semitones + 12) % 12
  return notes[newIndex] + suffix
}

export function transposeSegments(segments: ChordSegment[], semitones: number): ChordSegment[] {
  return segments.map(seg => ({
    ...seg,
    chord: transposeChord(seg.chord, semitones)
  }))
}

export function quantizeSegmentBoundaries(
  segments: ChordSegment[],
  quantizeMs: number
): ChordSegment[] {
  return segments.map(seg => ({
    ...seg,
    startMs: Math.round(seg.startMs / quantizeMs) * quantizeMs,
    endMs: Math.round(seg.endMs / quantizeMs) * quantizeMs
  }))
}

export function simplifySegments(segments: ChordSegment[], minDurationMs: number): ChordSegment[] {
  const simplified: ChordSegment[] = []
  
  for (const seg of segments) {
    if (seg.endMs - seg.startMs < minDurationMs) {
      if (simplified.length > 0) {
        simplified[simplified.length - 1].endMs = seg.endMs
      }
    } else {
      simplified.push({ ...seg })
    }
  }
  
  const merged: ChordSegment[] = []
  for (const seg of simplified) {
    if (merged.length > 0 && merged[merged.length - 1].chord === seg.chord) {
      merged[merged.length - 1].endMs = seg.endMs
    } else {
      merged.push(seg)
    }
  }
  
  return merged
}
