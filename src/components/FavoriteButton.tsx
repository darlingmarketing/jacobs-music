import { Star } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { useFavorites } from '@/hooks/useFavorites'
import type { Favorite } from '@/types'
import { cn } from '@/lib/utils'

interface FavoriteButtonProps {
  refId: string
  type: Favorite['type']
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function FavoriteButton({ refId, type, className, size = 'md' }: FavoriteButtonProps) {
  const { isFavorite, addFavorite, removeFavorite } = useFavorites()
  const active = isFavorite(refId, type)

  const iconSize = size === 'sm' ? 14 : size === 'lg' ? 22 : 18

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (active) {
      removeFavorite(refId, type)
    } else {
      addFavorite({ userId: 'local', type, refId })
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleClick}
      aria-label={active ? 'Remove from favorites' : 'Add to favorites'}
      className={cn('transition-colors', className)}
    >
      <Star
        size={iconSize}
        weight={active ? 'fill' : 'regular'}
        className={active ? 'text-yellow-400' : 'text-muted-foreground'}
      />
    </Button>
  )
}
