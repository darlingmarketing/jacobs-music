import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Star, Queue, WifiHigh, MusicNotes, Guitar } from '@phosphor-icons/react'
import { AppState } from '@/App'
import { useFavorites } from '@/hooks/useFavorites'
import { useSetlists } from '@/hooks/useSetlists'
import { SetlistManager } from '@/components/SetlistManager'
import { FavoriteButton } from '@/components/FavoriteButton'
import { isOfflineSupported } from '@/lib/offline'
import type { Song } from '@/types'
import { toast } from 'sonner'

interface LibraryProps {
  onNavigate: (page: AppState['currentPage'], songId?: string) => void
}

export function Library({ onNavigate }: LibraryProps) {
  const [songs] = useKV<Song[]>('songs', [])
  const [offlineSongs, setOfflineSongs] = useKV<string[]>('offline-songs', [])
  const { favorites, removeFavorite } = useFavorites()
  const { setlists } = useSetlists()
  const allSongs = songs ?? []
  const allOfflineSongs = offlineSongs ?? []

  const favoriteSongs = favorites
    .filter(f => f.type === 'song')
    .map(f => allSongs.find(s => s.id === f.refId))
    .filter(Boolean) as Song[]

  const favoriteChords = favorites.filter(f => f.type === 'chord')

  const offlineSupported = isOfflineSupported()

  const toggleOfflineSong = (songId: string) => {
    setOfflineSongs(prev => {
      const list = prev ?? []
      if (list.includes(songId)) {
        toast.success('Removed from offline cache')
        return list.filter(id => id !== songId)
      }
      toast.success('Song marked for offline access')
      return [...list, songId]
    })
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6">
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Library</h1>

      <Tabs defaultValue="favorites" className="w-full">
        <TabsList>
          <TabsTrigger value="favorites" className="gap-2">
            <Star size={16} />
            Favorites
            {favorites.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">{favorites.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="setlists" className="gap-2">
            <Queue size={16} />
            Setlists
            {setlists.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">{setlists.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="offline" className="gap-2">
            <WifiHigh size={16} />
            Offline
          </TabsTrigger>
        </TabsList>

        {/* Favorites tab */}
        <TabsContent value="favorites" className="space-y-6 mt-4">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <MusicNotes size={20} className="text-primary" />
              Favorite Songs
            </h2>
            {favoriteSongs.length === 0 ? (
              <Card className="p-8 text-center">
                <Star size={40} className="mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground text-sm">
                  No favorite songs yet. Star songs from My Songs to add them here.
                </p>
                <Button variant="outline" className="mt-4" onClick={() => onNavigate('songs')}>
                  Browse My Songs
                </Button>
              </Card>
            ) : (
              <div className="grid gap-3">
                {favoriteSongs.map(song => (
                  <Card
                    key={song.id}
                    className="p-4 hover:border-primary/50 transition-colors cursor-pointer"
                    onClick={() => onNavigate('editor', song.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold">{song.title}</h3>
                        {song.artist && (
                          <p className="text-sm text-muted-foreground">{song.artist}</p>
                        )}
                        <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                          {song.key && <span>Key: {song.key}</span>}
                          {song.tempo && <span>{song.tempo} BPM</span>}
                        </div>
                      </div>
                      <FavoriteButton refId={song.id} type="song" />
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {favoriteChords.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Guitar size={20} className="text-primary" />
                Favorite Chords
              </h2>
              <div className="flex flex-wrap gap-2">
                {favoriteChords.map(f => (
                  <div key={f.id} className="flex items-center gap-1">
                    <Badge variant="outline" className="text-sm px-3 py-1">
                      {f.refId}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => removeFavorite(f.refId, 'chord')}
                      aria-label="Remove chord favorite"
                    >
                      <Star size={12} weight="fill" className="text-yellow-400" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* Setlists tab */}
        <TabsContent value="setlists" className="mt-4">
          <SetlistManager
            songs={allSongs}
            onLaunchSetlist={setlist => {
              const firstSongId = setlist.songIds[0]
              if (firstSongId) {
                onNavigate('editor', firstSongId)
                toast.success(`Launching "${setlist.name}"`)
              }
            }}
          />
        </TabsContent>

        {/* Offline tab */}
        <TabsContent value="offline" className="space-y-4 mt-4">
          {!offlineSupported ? (
            <Card className="p-8 text-center">
              <WifiHigh size={40} className="mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground text-sm">
                Offline caching is not supported in this browser.
              </p>
            </Card>
          ) : (
            <>
              <Card className="p-4 bg-muted/50">
                <p className="text-sm text-muted-foreground">
                  Toggle songs below to cache them for offline use. Cached songs will be
                  available even without an internet connection.
                </p>
              </Card>

              {allSongs.length === 0 ? (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground text-sm">No songs to cache yet.</p>
                  <Button variant="outline" className="mt-4" onClick={() => onNavigate('songs')}>
                    Go to My Songs
                  </Button>
                </Card>
              ) : (
                <div className="grid gap-3">
                  {allSongs.map(song => (
                    <Card key={song.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate">{song.title}</h3>
                          {song.artist && (
                            <p className="text-sm text-muted-foreground truncate">{song.artist}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 ml-4 shrink-0">
                          <Label htmlFor={`offline-${song.id}`} className="text-xs text-muted-foreground">
                            Offline
                          </Label>
                          <Switch
                            id={`offline-${song.id}`}
                            checked={allOfflineSongs.includes(song.id)}
                            onCheckedChange={() => toggleOfflineSong(song.id)}
                          />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

