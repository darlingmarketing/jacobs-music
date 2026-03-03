export interface User {
  id: string
  email: string
  name?: string
  createdAt: string
}

export interface Song {
  id: string
  userId: string
  title: string
  artist?: string
  key?: string
  capo?: number
  tuning?: string
  tempo?: number
  tags: string[]
  sections: SongSection[]
  createdAt: string
  updatedAt: string
}

export interface SongSection {
  id: string
  type: 'intro' | 'verse' | 'chorus' | 'bridge' | 'outro' | 'custom'
  name?: string
  content: string
}

export interface Chord {
  name: string
  voicings: ChordVoicing[]
  tags?: string[]
}

export interface ChordVoicing {
  id: string
  frets: (number | 'x')[]
  fingers?: (number | null)[]
  baseFret?: number
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
  cachedMetadata?: Record<string, unknown>
  updatedAt: string
}

export interface UserSettings {
  leftHandedMode: boolean
  fontSize: number
  autoscrollSpeed: number
  metronomeVolume: number
}
