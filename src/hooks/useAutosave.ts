import { useEffect, useRef, useCallback } from 'react'
import { useKV } from '@github/spark/hooks'
import type { Song, SongVersion } from '@/types'

export function useAutosave(
  song: Song | null,
  onSave: (song: Song) => void,
  delay = 3000
) {
  const [, setVersions] = useKV<SongVersion[]>('song-versions', [])
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSavedIdRef = useRef<string | null>(null)

  const save = useCallback(
    (s: Song) => {
      onSave(s)
      const version: SongVersion = {
        id: `version-${Date.now()}`,
        songId: s.id,
        snapshot: s,
        author: s.userId,
        createdAt: new Date().toISOString()
      }
      setVersions(versions => [...(versions || []).slice(-19), version])
    },
    [onSave, setVersions]
  )

  useEffect(() => {
    if (!song) return

    if (timerRef.current) clearTimeout(timerRef.current)

    timerRef.current = setTimeout(() => {
      const saveKey = `${song.id}-${song.updatedAt}`
      if (lastSavedIdRef.current !== saveKey) {
        lastSavedIdRef.current = saveKey
        save(song)
      }
    }, delay)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [song, delay, save])
}
