import type { ParsedChord } from '@/types'

const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const FLAT_NOTES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']

export function parseChord(chordString: string): ParsedChord {
  const trimmed = chordString.trim()
  
  const slashMatch = trimmed.match(/^([A-G][#b]?)(.*)\/([A-G][#b]?)$/)
  if (slashMatch) {
    const [, root, quality, bass] = slashMatch
    return {
      original: trimmed,
      root: normalizeNote(root),
      quality: quality || 'major',
      bass: normalizeNote(bass),
      isValid: true
    }
  }

  const chordMatch = trimmed.match(/^([A-G][#b]?)(.*)$/)
  if (chordMatch) {
    const [, root, quality] = chordMatch
    return {
      original: trimmed,
      root: normalizeNote(root),
      quality: quality || 'major',
      isValid: true
    }
  }

  return {
    original: trimmed,
    root: '',
    isValid: false
  }
}

function normalizeNote(note: string): string {
  if (note.includes('b')) {
    const index = FLAT_NOTES.indexOf(note)
    return index !== -1 ? NOTES[index] : note
  }
  return note
}

export function transposeChord(chord: string, semitones: number): string {
  const parsed = parseChord(chord)
  if (!parsed.isValid) return chord

  const transposedRoot = transposeNote(parsed.root, semitones)
  const transposedBass = parsed.bass ? transposeNote(parsed.bass, semitones) : undefined

  let result = transposedRoot + (parsed.quality === 'major' ? '' : parsed.quality)
  if (transposedBass) {
    result += '/' + transposedBass
  }

  return result
}

function transposeNote(note: string, semitones: number): string {
  const index = NOTES.indexOf(note)
  if (index === -1) return note
  
  const newIndex = (index + semitones + 12) % 12
  return NOTES[newIndex]
}

export function extractChordsFromLine(line: string): string[] {
  const chords: string[] = []
  const inlineRegex = /\[([^\]]+)\]/g
  let match

  while ((match = inlineRegex.exec(line)) !== null) {
    chords.push(match[1])
  }

  const barRegex = /\|\s*([A-G][#b]?(?:m|maj|dim|aug|sus[24]|add\d+|\d+)?(?:\/[A-G][#b]?)?)\s*/g
  while ((match = barRegex.exec(line)) !== null) {
    chords.push(match[1])
  }

  return chords
}

export function parseLyricsWithChords(content: string): { type: 'line'; content: string; chords?: Array<{ chord: string; position: number }> }[] {
  const lines = content.split('\n')
  const result: { type: 'line'; content: string; chords?: Array<{ chord: string; position: number }> }[] = []

  for (const line of lines) {
    const chords: Array<{ chord: string; position: number }> = []
    const inlineRegex = /\[([^\]]+)\]/g
    let match
    let cleanLine = line

    while ((match = inlineRegex.exec(line)) !== null) {
      const chord = match[1]
      const position = match.index
      chords.push({ chord, position })
    }

    cleanLine = line.replace(/\[([^\]]+)\]/g, '')

    result.push({
      type: 'line',
      content: cleanLine,
      chords: chords.length > 0 ? chords : undefined
    })
  }

  return result
}
