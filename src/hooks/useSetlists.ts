import { useCallback } from 'react'
import { useKV } from '@github/spark/hooks'
import type { Setlist } from '@/types'

export function useSetlists() {
  const [setlists, setSetlists] = useKV<Setlist[]>('setlists', [])

  const createSetlist = useCallback(
    (name: string, description?: string) => {
      const newSetlist: Setlist = {
        id: `setlist-${Date.now()}`,
        userId: 'local',
        name,
        description,
        songIds: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      setSetlists(prev => [...(prev ?? []), newSetlist])
      return newSetlist
    },
    [setSetlists]
  )

  const deleteSetlist = useCallback(
    (id: string) => {
      setSetlists(prev => (prev ?? []).filter(s => s.id !== id))
    },
    [setSetlists]
  )

  const addSongToSetlist = useCallback(
    (setlistId: string, songId: string) => {
      setSetlists(prev =>
        (prev ?? []).map(s =>
          s.id === setlistId && !s.songIds.includes(songId)
            ? { ...s, songIds: [...s.songIds, songId], updatedAt: new Date().toISOString() }
            : s
        )
      )
    },
    [setSetlists]
  )

  const removeSongFromSetlist = useCallback(
    (setlistId: string, songId: string) => {
      setSetlists(prev =>
        (prev ?? []).map(s =>
          s.id === setlistId
            ? { ...s, songIds: s.songIds.filter(id => id !== songId), updatedAt: new Date().toISOString() }
            : s
        )
      )
    },
    [setSetlists]
  )

  const updateSetlist = useCallback(
    (id: string, updates: Partial<Pick<Setlist, 'name' | 'description'>>) => {
      setSetlists(prev =>
        (prev ?? []).map(s =>
          s.id === id
            ? { ...s, ...updates, updatedAt: new Date().toISOString() }
            : s
        )
      )
    },
    [setSetlists]
  )

  return {
    setlists: setlists ?? [],
    createSetlist,
    deleteSetlist,
    addSongToSetlist,
    removeSongFromSetlist,
    updateSetlist,
  }
}
