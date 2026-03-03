import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MagnifyingGlass } from '@phosphor-icons/react'
import { AppState } from '@/App'

interface DiscoverProps {
  onNavigate: (page: AppState['currentPage'], songId?: string) => void
}

export function Discover({ onNavigate }: DiscoverProps) {
  const [search, setSearch] = useState('')

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6">
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Discover</h1>

      <Card className="p-6">
        <div className="space-y-4">
          <div className="relative">
            <MagnifyingGlass size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search for songs, artists..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button className="w-full">
            <MagnifyingGlass size={20} className="mr-2" />
            Search
          </Button>
        </div>
      </Card>

      <Card className="p-12 text-center">
        <p className="text-muted-foreground">
          Search external music databases for song metadata and lyrics. Integration with MusicBrainz and LRCLIB coming soon.
        </p>
      </Card>
    </div>
  )
}
