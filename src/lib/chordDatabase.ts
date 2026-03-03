import { Chord } from '@/types'

export const CHORD_DATABASE: Chord[] = [
  {
    name: 'C',
    voicings: [
      { id: 'c-1', frets: ['x', 3, 2, 0, 1, 0], fingers: [null, 3, 2, null, 1, null] },
      { id: 'c-2', frets: [3, 3, 5, 5, 5, 3], fingers: [1, 1, 2, 3, 4, 1], baseFret: 3 }
    ]
  },
  {
    name: 'Cm',
    voicings: [
      { id: 'cm-1', frets: ['x', 3, 5, 5, 4, 3], fingers: [null, 1, 3, 4, 2, 1], baseFret: 3 },
      { id: 'cm-2', frets: [3, 3, 5, 5, 4, 3], fingers: [1, 1, 3, 4, 2, 1], baseFret: 3 }
    ]
  },
  {
    name: 'C7',
    voicings: [
      { id: 'c7-1', frets: ['x', 3, 2, 3, 1, 0], fingers: [null, 3, 2, 4, 1, null] },
      { id: 'c7-2', frets: [3, 3, 5, 3, 5, 3], fingers: [1, 1, 3, 1, 4, 1], baseFret: 3 }
    ]
  },
  {
    name: 'Cmaj7',
    voicings: [
      { id: 'cmaj7-1', frets: ['x', 3, 2, 0, 0, 0], fingers: [null, 3, 2, null, null, null] },
      { id: 'cmaj7-2', frets: ['x', 3, 5, 4, 5, 3], fingers: [null, 1, 3, 2, 4, 1] }
    ]
  },
  {
    name: 'D',
    voicings: [
      { id: 'd-1', frets: ['x', 'x', 0, 2, 3, 2], fingers: [null, null, null, 1, 3, 2] },
      { id: 'd-2', frets: [5, 5, 7, 7, 7, 5], fingers: [1, 1, 2, 3, 4, 1], baseFret: 5 }
    ]
  },
  {
    name: 'Dm',
    voicings: [
      { id: 'dm-1', frets: ['x', 'x', 0, 2, 3, 1], fingers: [null, null, null, 2, 3, 1] },
      { id: 'dm-2', frets: [5, 5, 7, 7, 6, 5], fingers: [1, 1, 3, 4, 2, 1], baseFret: 5 }
    ]
  },
  {
    name: 'D7',
    voicings: [
      { id: 'd7-1', frets: ['x', 'x', 0, 2, 1, 2], fingers: [null, null, null, 2, 1, 3] },
      { id: 'd7-2', frets: [5, 5, 7, 5, 7, 5], fingers: [1, 1, 3, 1, 4, 1], baseFret: 5 }
    ]
  },
  {
    name: 'Dmaj7',
    voicings: [
      { id: 'dmaj7-1', frets: ['x', 'x', 0, 2, 2, 2], fingers: [null, null, null, 1, 1, 1] },
      { id: 'dmaj7-2', frets: ['x', 5, 7, 6, 7, 5], fingers: [null, 1, 3, 2, 4, 1] }
    ]
  },
  {
    name: 'E',
    voicings: [
      { id: 'e-1', frets: [0, 2, 2, 1, 0, 0], fingers: [null, 2, 3, 1, null, null] },
      { id: 'e-2', frets: [7, 7, 9, 9, 9, 7], fingers: [1, 1, 2, 3, 4, 1], baseFret: 7 }
    ]
  },
  {
    name: 'Em',
    voicings: [
      { id: 'em-1', frets: [0, 2, 2, 0, 0, 0], fingers: [null, 2, 3, null, null, null] },
      { id: 'em-2', frets: [7, 7, 9, 9, 8, 7], fingers: [1, 1, 3, 4, 2, 1], baseFret: 7 }
    ]
  },
  {
    name: 'E7',
    voicings: [
      { id: 'e7-1', frets: [0, 2, 0, 1, 0, 0], fingers: [null, 2, null, 1, null, null] },
      { id: 'e7-2', frets: [7, 7, 9, 7, 9, 7], fingers: [1, 1, 3, 1, 4, 1], baseFret: 7 }
    ]
  },
  {
    name: 'Emaj7',
    voicings: [
      { id: 'emaj7-1', frets: [0, 2, 1, 1, 0, 0], fingers: [null, 3, 1, 2, null, null] },
      { id: 'emaj7-2', frets: ['x', 7, 9, 8, 9, 7], fingers: [null, 1, 3, 2, 4, 1] }
    ]
  },
  {
    name: 'F',
    voicings: [
      { id: 'f-1', frets: [1, 3, 3, 2, 1, 1], fingers: [1, 3, 4, 2, 1, 1] },
      { id: 'f-2', frets: ['x', 'x', 3, 2, 1, 1], fingers: [null, null, 3, 2, 1, 1] }
    ]
  },
  {
    name: 'Fm',
    voicings: [
      { id: 'fm-1', frets: [1, 3, 3, 1, 1, 1], fingers: [1, 3, 4, 1, 1, 1] },
      { id: 'fm-2', frets: ['x', 'x', 3, 1, 1, 1], fingers: [null, null, 3, 1, 1, 1] }
    ]
  },
  {
    name: 'F7',
    voicings: [
      { id: 'f7-1', frets: [1, 3, 1, 2, 1, 1], fingers: [1, 3, 1, 2, 1, 1] },
      { id: 'f7-2', frets: ['x', 'x', 3, 2, 1, 2], fingers: [null, null, 3, 2, 1, 4] }
    ]
  },
  {
    name: 'Fmaj7',
    voicings: [
      { id: 'fmaj7-1', frets: [1, 3, 2, 2, 1, 1], fingers: [1, 4, 2, 3, 1, 1] },
      { id: 'fmaj7-2', frets: ['x', 'x', 3, 2, 1, 0], fingers: [null, null, 3, 2, 1, null] }
    ]
  },
  {
    name: 'G',
    voicings: [
      { id: 'g-1', frets: [3, 2, 0, 0, 0, 3], fingers: [2, 1, null, null, null, 3] },
      { id: 'g-2', frets: [3, 5, 5, 4, 3, 3], fingers: [1, 3, 4, 2, 1, 1], baseFret: 3 }
    ]
  },
  {
    name: 'Gm',
    voicings: [
      { id: 'gm-1', frets: [3, 5, 5, 3, 3, 3], fingers: [1, 3, 4, 1, 1, 1], baseFret: 3 },
      { id: 'gm-2', frets: ['x', 'x', 5, 3, 3, 3], fingers: [null, null, 3, 1, 1, 1] }
    ]
  },
  {
    name: 'G7',
    voicings: [
      { id: 'g7-1', frets: [3, 2, 0, 0, 0, 1], fingers: [3, 2, null, null, null, 1] },
      { id: 'g7-2', frets: [3, 5, 3, 4, 3, 3], fingers: [1, 3, 1, 2, 1, 1], baseFret: 3 }
    ]
  },
  {
    name: 'Gmaj7',
    voicings: [
      { id: 'gmaj7-1', frets: [3, 2, 0, 0, 0, 2], fingers: [3, 1, null, null, null, 2] },
      { id: 'gmaj7-2', frets: ['x', 'x', 5, 4, 3, 2], fingers: [null, null, 4, 3, 2, 1] }
    ]
  },
  {
    name: 'A',
    voicings: [
      { id: 'a-1', frets: ['x', 0, 2, 2, 2, 0], fingers: [null, null, 1, 2, 3, null] },
      { id: 'a-2', frets: [5, 7, 7, 6, 5, 5], fingers: [1, 3, 4, 2, 1, 1], baseFret: 5 }
    ]
  },
  {
    name: 'Am',
    voicings: [
      { id: 'am-1', frets: ['x', 0, 2, 2, 1, 0], fingers: [null, null, 2, 3, 1, null] },
      { id: 'am-2', frets: [5, 7, 7, 5, 5, 5], fingers: [1, 3, 4, 1, 1, 1], baseFret: 5 }
    ]
  },
  {
    name: 'A7',
    voicings: [
      { id: 'a7-1', frets: ['x', 0, 2, 0, 2, 0], fingers: [null, null, 2, null, 3, null] },
      { id: 'a7-2', frets: [5, 7, 5, 6, 5, 5], fingers: [1, 3, 1, 2, 1, 1], baseFret: 5 }
    ]
  },
  {
    name: 'Amaj7',
    voicings: [
      { id: 'amaj7-1', frets: ['x', 0, 2, 1, 2, 0], fingers: [null, null, 2, 1, 3, null] },
      { id: 'amaj7-2', frets: ['x', 'x', 7, 6, 5, 4], fingers: [null, null, 4, 3, 2, 1] }
    ]
  },
  {
    name: 'B',
    voicings: [
      { id: 'b-1', frets: ['x', 2, 4, 4, 4, 2], fingers: [null, 1, 2, 3, 4, 1] },
      { id: 'b-2', frets: [7, 9, 9, 8, 7, 7], fingers: [1, 3, 4, 2, 1, 1], baseFret: 7 }
    ]
  },
  {
    name: 'Bm',
    voicings: [
      { id: 'bm-1', frets: ['x', 2, 4, 4, 3, 2], fingers: [null, 1, 3, 4, 2, 1] },
      { id: 'bm-2', frets: [7, 9, 9, 7, 7, 7], fingers: [1, 3, 4, 1, 1, 1], baseFret: 7 }
    ]
  },
  {
    name: 'B7',
    voicings: [
      { id: 'b7-1', frets: ['x', 2, 1, 2, 0, 2], fingers: [null, 2, 1, 3, null, 4] },
      { id: 'b7-2', frets: [7, 9, 7, 8, 7, 7], fingers: [1, 3, 1, 2, 1, 1], baseFret: 7 }
    ]
  },
  {
    name: 'Bmaj7',
    voicings: [
      { id: 'bmaj7-1', frets: ['x', 2, 4, 3, 4, 2], fingers: [null, 1, 3, 2, 4, 1] },
      { id: 'bmaj7-2', frets: ['x', 'x', 9, 8, 7, 6], fingers: [null, null, 4, 3, 2, 1] }
    ]
  }
]

export function searchChords(query: string): Chord[] {
  const normalized = query.toLowerCase().trim()
  
  if (!normalized) return CHORD_DATABASE
  
  return CHORD_DATABASE.filter(chord => 
    chord.name.toLowerCase().includes(normalized)
  )
}

export function getChordByName(name: string): Chord | undefined {
  return CHORD_DATABASE.find(chord => 
    chord.name.toLowerCase() === name.toLowerCase()
  )
}
