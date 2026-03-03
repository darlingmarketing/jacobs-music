export interface User {
  id: string
  email: string
  name?: string
  createdAt: string
}

export type BlockType = 'lyrics' | 'chords' | 'tab' | 'note'

export interface Block {
  id: string
  type: BlockType
  content: string
  meta?: {
    alignment?: 'left' | 'center' | 'right'
    instrument?: 'guitar' | 'bass' | 'ukulele'
    repeatCount?: number
    loopRange?: { start: number; end: number }
  }
}

export type SectionType = 'intro' | 'verse' | 'chorus' | 'bridge' | 'outro' | 'solo' | 'custom'

export interface Section {
  id: string
  name: string
  type: SectionType
  order: number
  blocks: Block[]
}

export type Difficulty = 'easy' | 'medium' | 'hard'

export interface Song {
  id: string
  userId: string
  title: string
  description?: string
  artist?: string
  key?: string
  tempo?: number
  timeSignature?: string
  capo?: number
  tuning?: string
  difficulty?: Difficulty
  tags: string[]
  sections: Section[]
  createdAt: string
  updatedAt: string
}

export interface ChordVoicing {
  id: string
  frets: (number | -1)[]
  fingers?: (number | null)[]
  baseFret: number
  tags?: string[]
}

export interface Chord {
  id: string
  name: string
  voicings: ChordVoicing[]
  tags?: string[]
}

export interface Favorite {
  id: string
  userId: string
  type: 'song' | 'externalSong' | 'chord'
  refId: string
  createdAt: string
}

export interface Setlist {
  id: string
  userId: string
  name: string
  description?: string
  songIds: string[]
  createdAt: string
  updatedAt: string
}

export interface ExternalSong {
  id: string
  provider: string
  providerId: string
  title: string
  artist?: string
  url: string
  cachedMetadata?: {
    key?: string
    tempo?: number
    difficulty?: string
    duration?: number
  }
  createdAt: string
  updatedAt: string
}

export interface UserSettings {
  leftHandedMode: boolean
  fontSize: number
  autoscrollSpeed: number
  metronomeVolume: number
  darkMode: boolean
}

export interface ParsedChord {
  original: string
  root: string
  quality?: string
  bass?: string
  isValid: boolean
}
