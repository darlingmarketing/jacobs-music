import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Song } from '@/types'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, MagnifyingGlass, Pencil, Sparkle, Star, Queue } from '@phosphor-icons/react'
import { AppState } from '@/App'
import { SmartSearch } from '@/components/SmartSearch'
import { FavoriteButton } from '@/components/FavoriteButton'
import { AddToSetlistButton } from '@/components/SetlistManager'
import { useFavorites } from '@/hooks/useFavorites'
import { useSetlists } from '@/hooks/useSetlists'

interface MySongsProps {
  onNavigate: (page: AppState['currentPage'], songId?: string) => void
}

export function MySongs({ onNavigate }: MySongsProps) {
  const [songs] = useKV<Song[]>('songs', [])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'favorites' | string>('all')
  const { isFavorite, favorites } = useFavorites()
  const { setlists } = useSetlists()
  const allSongs = songs || []

  const filteredSongs = allSongs.filter(song => {
    const matchesSearch =
      song.title.toLowerCase().includes(search.toLowerCase()) ||
      song.artist?.toLowerCase().includes(search.toLowerCase()) ||
      song.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()))

    if (!matchesSearch) return false

    if (filter === 'favorites') {
      return isFavorite(song.id, 'song')
    }
    if (filter !== 'all') {
      // filter is a setlist ID
      const setlist = setlists.find(s => s.id === filter)
      return setlist ? setlist.songIds.includes(song.id) : true
    }
    return true
  })

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">My Songs</h1>
        <Button onClick={() => onNavigate('editor')} className="gap-2">
          <Plus size={20} weight="bold" />
          New Song
        </Button>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">
            <MagnifyingGlass className="mr-2" size={16} />
            All Songs
          </TabsTrigger>
          <TabsTrigger value="smart">
            <Sparkle className="mr-2" size={16} />
            Smart Search
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <MagnifyingGlass size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search songs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-44 shrink-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All songs</SelectItem>
                <SelectItem value="favorites">
                  <span className="flex items-center gap-2">
                    <Star size={14} className="text-yellow-400" weight="fill" />
                    Favorites
                  </span>
                </SelectItem>
                {setlists.map(sl => (
                  <SelectItem key={sl.id} value={sl.id}>
                    <span className="flex items-center gap-2">
                      <Queue size={14} />
                      {sl.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {filteredSongs.length === 0 && search === '' && filter === 'all' ? (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground mb-4">No songs yet. Start creating!</p>
              <Button onClick={() => onNavigate('editor')} className="gap-2">
                <Plus size={20} weight="bold" />
                Create Your First Song
              </Button>
            </Card>
          ) : filteredSongs.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground">
                {filter === 'favorites'
                  ? 'No favorite songs yet. Star songs to add them here.'
                  : filter !== 'all'
                  ? 'No songs in this setlist match your search.'
                  : `No songs match "${search}"`}
              </p>
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
                    <div className="flex items-center gap-1 shrink-0">
                      <FavoriteButton refId={song.id} type="song" size="sm" />
                      <AddToSetlistButton songId={song.id} songs={allSongs} />
                      <Button variant="ghost" size="icon" className="text-primary"
                        onClick={e => { e.stopPropagation(); onNavigate('editor', song.id) }}>
                        <Pencil size={20} />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="smart" className="space-y-4">
          <SmartSearch songs={allSongs} onSelectSong={(id) => onNavigate('editor', id)} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
