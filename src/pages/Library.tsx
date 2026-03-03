import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Star } from '@phosphor-icons/react'
import { AppState } from '@/App'

interface LibraryProps {
  onNavigate: (page: AppState['currentPage'], songId?: string) => void
}

export function Library({ onNavigate }: LibraryProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6">
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Library</h1>
      
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-8 text-center">
          <Star size={48} weight="fill" className="mx-auto text-primary mb-4" />
          <h3 className="font-semibold text-lg mb-2">Favorites</h3>
          <p className="text-sm text-muted-foreground mb-4">Save your favorite songs and chords</p>
          <Button variant="outline">View Favorites</Button>
        </Card>

        <Card className="p-8 text-center">
          <div className="text-4xl mb-4">🎸</div>
          <h3 className="font-semibold text-lg mb-2">Setlists</h3>
          <p className="text-sm text-muted-foreground mb-4">Organize songs for gigs and practice</p>
          <Button variant="outline">Create Setlist</Button>
        </Card>
      </div>

      <Card className="p-8 text-center">
        <p className="text-muted-foreground">Library features coming soon with favorites, setlists, and collections.</p>
      </Card>
    </div>
  )
}
