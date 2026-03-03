import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Song } from '@/types'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, MagnifyingGlass, Pencil } from '@phosphor-icons/react'
import { AppState } from '@/App'

interface MySongsProps {
  onNavigate: (page: AppState['currentPage'], songId?: string) => void
}

export function MySongs({ onNavigate }: MySongsProps) {
  const [songs] = useKV<Song[]>('songs', [])
  const [search, setSearch] = useState('')
  const allSongs = songs || []
  
  const filteredSongs = allSongs.filter(song =>
    song.title.toLowerCase().includes(search.toLowerCase()) ||
    song.artist?.toLowerCase().includes(search.toLowerCase()) ||
    song.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">My Songs</h1>
        <Button onClick={() => onNavigate('editor')} className="gap-2">
          <Plus size={20} weight="bold" />
          New Song
        </Button>
      </div>

      <div className="relative">
        <MagnifyingGlass size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search songs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {filteredSongs.length === 0 && search === '' ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground mb-4">No songs yet. Start creating!</p>
          <Button onClick={() => onNavigate('editor')} className="gap-2">
            <Plus size={20} weight="bold" />
            Create Your First Song
          </Button>
        </Card>
      ) : filteredSongs.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">No songs match "{search}"</p>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filteredSongs.map(song => (
            <Card
              key={song.id}
              className="p-4 hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => onNavigate('editor', song.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{song.title}</h3>
                  {song.artist && <p className="text-sm text-muted-foreground">{song.artist}</p>}
                  <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                    {song.key && <span>Key: {song.key}</span>}
                    {song.tempo && <span>{song.tempo} BPM</span>}
                    {song.capo && <span>Capo: {song.capo}</span>}
                  </div>
                  {song.tags.length > 0 && (
                    <div className="flex gap-1 mt-2">
                      {song.tags.map(tag => (
                        <span key={tag} className="px-2 py-0.5 bg-secondary rounded text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <Button variant="ghost" size="icon" className="text-primary">
                  <Pencil size={20} />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
