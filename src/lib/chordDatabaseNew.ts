import type { Chord } from '@/types'

export const CHORD_DATABASE: Chord[] = [
  {
    id: 'C',
    name: 'C',
    voicings: [
      { id: 'c-1', frets: [-1, 3, 2, 0, 1, 0], fingers: [null, 3, 2, null, 1, null], baseFret: 0, tags: ['open'] },
      { id: 'c-2', frets: [3, 3, 5, 5, 5, 3], fingers: [1, 1, 2, 3, 4, 1], baseFret: 3, tags: ['barre'] }
    ],
    tags: ['major']
  },
  {
    id: 'Cm',
    name: 'Cm',
    voicings: [
      { id: 'cm-1', frets: [-1, 3, 5, 5, 4, 3], fingers: [null, 1, 3, 4, 2, 1], baseFret: 0, tags: ['barre'] },
      { id: 'cm-2', frets: [3, 3, 5, 5, 4, 3], fingers: [1, 1, 3, 4, 2, 1], baseFret: 3, tags: ['barre'] }
    ],
    tags: ['minor']
  },
  {
    id: 'C7',
    name: 'C7',
    voicings: [
      { id: 'c7-1', frets: [-1, 3, 2, 3, 1, 0], fingers: [null, 3, 2, 4, 1, null], baseFret: 0, tags: ['open'] }
    ],
    tags: ['seventh']
  },
  {
    id: 'Cmaj7',
    name: 'Cmaj7',
    voicings: [
      { id: 'cmaj7-1', frets: [-1, 3, 2, 0, 0, 0], fingers: [null, 3, 2, null, null, null], baseFret: 0, tags: ['open'] }
    ],
    tags: ['major seventh']
  },
  {
    id: 'D',
    name: 'D',
    voicings: [
      { id: 'd-1', frets: [-1, -1, 0, 2, 3, 2], fingers: [null, null, null, 1, 3, 2], baseFret: 0, tags: ['open'] },
      { id: 'd-2', frets: [5, 5, 7, 7, 7, 5], fingers: [1, 1, 2, 3, 4, 1], baseFret: 5, tags: ['barre'] }
    ],
    tags: ['major']
  },
  {
    id: 'Dm',
    name: 'Dm',
    voicings: [
      { id: 'dm-1', frets: [-1, -1, 0, 2, 3, 1], fingers: [null, null, null, 2, 3, 1], baseFret: 0, tags: ['open'] }
    ],
    tags: ['minor']
  },
  {
    id: 'D7',
    name: 'D7',
    voicings: [
      { id: 'd7-1', frets: [-1, -1, 0, 2, 1, 2], fingers: [null, null, null, 2, 1, 3], baseFret: 0, tags: ['open'] }
    ],
    tags: ['seventh']
  },
  {
    id: 'E',
    name: 'E',
    voicings: [
      { id: 'e-1', frets: [0, 2, 2, 1, 0, 0], fingers: [null, 2, 3, 1, null, null], baseFret: 0, tags: ['open'] },
      { id: 'e-2', frets: [7, 7, 9, 9, 9, 7], fingers: [1, 1, 2, 3, 4, 1], baseFret: 7, tags: ['barre'] }
    ],
    tags: ['major']
  },
  {
    id: 'Em',
    name: 'Em',
    voicings: [
      { id: 'em-1', frets: [0, 2, 2, 0, 0, 0], fingers: [null, 2, 3, null, null, null], baseFret: 0, tags: ['open'] }
    ],
    tags: ['minor']
  },
  {
    id: 'E7',
    name: 'E7',
    voicings: [
      { id: 'e7-1', frets: [0, 2, 0, 1, 0, 0], fingers: [null, 2, null, 1, null, null], baseFret: 0, tags: ['open'] }
    ],
    tags: ['seventh']
  },
  {
    id: 'F',
    name: 'F',
    voicings: [
      { id: 'f-1', frets: [1, 3, 3, 2, 1, 1], fingers: [1, 3, 4, 2, 1, 1], baseFret: 0, tags: ['barre'] },
      { id: 'f-2', frets: [-1, -1, 3, 2, 1, 1], fingers: [null, null, 3, 2, 1, 1], baseFret: 0, tags: ['partial'] }
    ],
    tags: ['major']
  },
  {
    id: 'Fm',
    name: 'Fm',
    voicings: [
      { id: 'fm-1', frets: [1, 3, 3, 1, 1, 1], fingers: [1, 3, 4, 1, 1, 1], baseFret: 0, tags: ['barre'] }
    ],
    tags: ['minor']
  },
  {
    id: 'F7',
    name: 'F7',
    voicings: [
      { id: 'f7-1', frets: [1, 3, 1, 2, 1, 1], fingers: [1, 3, 1, 2, 1, 1], baseFret: 0, tags: ['barre'] }
    ],
    tags: ['seventh']
  },
  {
    id: 'G',
    name: 'G',
    voicings: [
      { id: 'g-1', frets: [3, 2, 0, 0, 0, 3], fingers: [3, 2, null, null, null, 4], baseFret: 0, tags: ['open'] },
      { id: 'g-2', frets: [3, 2, 0, 0, 3, 3], fingers: [2, 1, null, null, 3, 4], baseFret: 0, tags: ['open'] },
      { id: 'g-3', frets: [3, 5, 5, 4, 3, 3], fingers: [1, 3, 4, 2, 1, 1], baseFret: 3, tags: ['barre'] }
    ],
    tags: ['major']
  },
  {
    id: 'Gm',
    name: 'Gm',
    voicings: [
      { id: 'gm-1', frets: [3, 5, 5, 3, 3, 3], fingers: [1, 3, 4, 1, 1, 1], baseFret: 0, tags: ['barre'] }
    ],
    tags: ['minor']
  },
  {
    id: 'G7',
    name: 'G7',
    voicings: [
      { id: 'g7-1', frets: [3, 2, 0, 0, 0, 1], fingers: [3, 2, null, null, null, 1], baseFret: 0, tags: ['open'] }
    ],
    tags: ['seventh']
  },
  {
    id: 'A',
    name: 'A',
    voicings: [
      { id: 'a-1', frets: [-1, 0, 2, 2, 2, 0], fingers: [null, null, 1, 2, 3, null], baseFret: 0, tags: ['open'] },
      { id: 'a-2', frets: [5, 7, 7, 6, 5, 5], fingers: [1, 3, 4, 2, 1, 1], baseFret: 5, tags: ['barre'] }
    ],
    tags: ['major']
  },
  {
    id: 'Am',
    name: 'Am',
    voicings: [
      { id: 'am-1', frets: [-1, 0, 2, 2, 1, 0], fingers: [null, null, 2, 3, 1, null], baseFret: 0, tags: ['open'] },
      { id: 'am-2', frets: [5, 7, 7, 5, 5, 5], fingers: [1, 3, 4, 1, 1, 1], baseFret: 5, tags: ['barre'] }
    ],
    tags: ['minor']
  },
  {
    id: 'A7',
    name: 'A7',
    voicings: [
      { id: 'a7-1', frets: [-1, 0, 2, 0, 2, 0], fingers: [null, null, 2, null, 3, null], baseFret: 0, tags: ['open'] }
    ],
    tags: ['seventh']
  },
  {
    id: 'B',
    name: 'B',
    voicings: [
      { id: 'b-1', frets: [-1, 2, 4, 4, 4, 2], fingers: [null, 1, 3, 3, 3, 1], baseFret: 0, tags: ['barre'] },
      { id: 'b-2', frets: [7, 9, 9, 8, 7, 7], fingers: [1, 3, 4, 2, 1, 1], baseFret: 7, tags: ['barre'] }
    ],
    tags: ['major']
  },
  {
    id: 'Bm',
    name: 'Bm',
    voicings: [
      { id: 'bm-1', frets: [-1, 2, 4, 4, 3, 2], fingers: [null, 1, 3, 4, 2, 1], baseFret: 0, tags: ['barre'] }
    ],
    tags: ['minor']
  },
  {
    id: 'B7',
    name: 'B7',
    voicings: [
      { id: 'b7-1', frets: [-1, 2, 1, 2, 0, 2], fingers: [null, 2, 1, 3, null, 4], baseFret: 0, tags: ['open'] }
    ],
    tags: ['seventh']
  },
  {
    id: 'Em7',
    name: 'Em7',
    voicings: [
      { id: 'em7-1', frets: [0, 2, 0, 0, 0, 0], fingers: [null, 2, null, null, null, null], baseFret: 0, tags: ['open'] }
    ],
    tags: ['minor seventh']
  },
  {
    id: 'Am7',
    name: 'Am7',
    voicings: [
      { id: 'am7-1', frets: [-1, 0, 2, 0, 1, 0], fingers: [null, null, 2, null, 1, null], baseFret: 0, tags: ['open'] }
    ],
    tags: ['minor seventh']
  },
  {
    id: 'Dm7',
    name: 'Dm7',
    voicings: [
      { id: 'dm7-1', frets: [-1, -1, 0, 2, 1, 1], fingers: [null, null, null, 2, 1, 1], baseFret: 0, tags: ['open'] }
    ],
    tags: ['minor seventh']
  }
]

export function searchChords(query: string): Chord[] {
  const lowerQuery = query.toLowerCase()
  return CHORD_DATABASE.filter(chord =>
    chord.name.toLowerCase().includes(lowerQuery) ||
    chord.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
  )
}

export function getChordByName(name: string): Chord | undefined {
  return CHORD_DATABASE.find(chord => chord.name === name)
}
