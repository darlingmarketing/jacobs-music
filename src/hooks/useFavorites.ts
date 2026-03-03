import { useCallback } from 'react'
import { useKV } from '@github/spark/hooks'
import type { Favorite } from '@/types'

export function useFavorites() {
  const [favorites, setFavorites] = useKV<Favorite[]>('favorites', [])

  const addFavorite = useCallback(
    (item: Omit<Favorite, 'id' | 'createdAt'>) => {
      setFavorites(prev => {
        const list = prev ?? []
        if (list.some(f => f.refId === item.refId && f.type === item.type)) {
          return list
        }
        const newFav: Favorite = {
          ...item,
          id: `fav-${Date.now()}`,
          createdAt: new Date().toISOString(),
        }
        return [...list, newFav]
      })
    },
    [setFavorites]
  )

  const removeFavorite = useCallback(
    (refId: string, type: Favorite['type']) => {
      setFavorites(prev =>
        (prev ?? []).filter(f => !(f.refId === refId && f.type === type))
      )
    },
    [setFavorites]
  )

  const isFavorite = useCallback(
    (refId: string, type: Favorite['type']) =>
      (favorites ?? []).some(f => f.refId === refId && f.type === type),
    [favorites]
  )

  return {
    favorites: favorites ?? [],
    addFavorite,
    removeFavorite,
    isFavorite,
  }
}
