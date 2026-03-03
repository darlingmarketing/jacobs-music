const NOTE_MAP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const FLAT_MAP: Record<string, string> = {
  'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#'
}

export function transposeChord(chord: string, semitones: number): string {
  const chordPattern = /^([A-G][#b]?)(.*)/
  const match = chord.match(chordPattern)
  
  if (!match) return chord
  
  let [, root, suffix] = match
  
  if (root in FLAT_MAP) {
    root = FLAT_MAP[root]
  }
  
  const currentIndex = NOTE_MAP.indexOf(root)
  if (currentIndex === -1) return chord
  
  const newIndex = (currentIndex + semitones + 12) % 12
  const newRoot = NOTE_MAP[newIndex]
  
  return newRoot + suffix
}

export function transposeChordLine(line: string, semitones: number): string {
  return line.replace(/\b([A-G][#b]?(?:m|maj|min|dim|aug|sus|add)?[0-9]*(?:\/[A-G][#b]?)?)\b/g, 
    (match) => transposeChord(match, semitones)
  )
}

export function parseInlineChords(text: string): Array<{ type: 'text' | 'chord', content: string }> {
  const parts: Array<{ type: 'text' | 'chord', content: string }> = []
  const pattern = /\[([^\]]+)\]/g
  let lastIndex = 0
  let match
  
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: text.slice(lastIndex, match.index) })
    }
    parts.push({ type: 'chord', content: match[1] })
    lastIndex = pattern.lastIndex
  }
  
  if (lastIndex < text.length) {
    parts.push({ type: 'text', content: text.slice(lastIndex) })
  }
  
  return parts
}

export function transposeInlineChords(text: string, semitones: number): string {
  return text.replace(/\[([^\]]+)\]/g, (match, chord) => {
    return `[${transposeChord(chord, semitones)}]`
  })
}

export function calculateCapoTransposition(originalKey: string, capoFret: number): {
  displayKey: string
  actualKey: string
  simplifiedChords: boolean
} {
  const displayKey = transposeChord(originalKey, -capoFret)
  
  return {
    displayKey,
    actualKey: originalKey,
    simplifiedChords: true
  }
}

export function normalizeChordName(chord: string): string {
  return chord
    .replace(/maj7/i, 'M7')
    .replace(/major/i, 'maj')
    .replace(/minor/i, 'm')
    .trim()
}
