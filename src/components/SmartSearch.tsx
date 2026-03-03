import { useState } from 'react'
import type { Song } from '@/types'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MagnifyingGlass, Sparkle, X } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface SmartSearchProps {
  songs: Song[]
  onSelectSong?: (songId: string) => void
}

export function SmartSearch({ songs, onSelectSong }: SmartSearchProps) {
  const [query, setQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [results, setResults] = useState<Song[]>([])
  const [searchIntent, setSearchIntent] = useState<string>('')

  const handleSmartSearch = async () => {
    if (!query.trim()) {
      toast.error('Please enter a search query')
      return
    }

    setIsSearching(true)
    setSearchIntent('')

    try {
      const prompt = spark.llmPrompt`You are a music search assistant. Parse this natural language query and extract search criteria.

User query: "${query}"

Available songs data structure:
- title (string)
- artist (string)
- key (string, e.g., "C", "Am", "G#")
- tempo (number, BPM)
- difficulty ("easy", "medium", "hard")
- tags (array of strings)
- sections with chords

Return valid JSON in this exact format:
{
  "intent": "brief description of what user is looking for",
  "criteria": {
    "key": "optional key filter",
    "minTempo": "optional min BPM",
    "maxTempo": "optional max BPM",
    "difficulty": "optional difficulty",
    "tags": ["optional", "tag", "filters"],
    "chords": ["optional", "chord", "filters"],
    "artist": "optional artist filter",
    "keywords": ["search", "keywords"]
  }
}

Examples:
"slow songs in the key of G" → { "intent": "Songs in G major with slow tempo", "criteria": { "key": "G", "maxTempo": "90" } }
"easy fingerstyle songs" → { "intent": "Simple fingerstyle guitar songs", "criteria": { "difficulty": "easy", "tags": ["fingerstyle"] } }
"songs with Cadd9" → { "intent": "Songs containing Cadd9 chord", "criteria": { "chords": ["Cadd9"] } }`

      const response = await spark.llm(prompt, 'gpt-4o-mini', true)
      const parsed = JSON.parse(response)
      
      setSearchIntent(parsed.intent || '')
      
      const filtered = songs.filter(song => {
        const criteria = parsed.criteria || {}
        
        if (criteria.key && song.key !== criteria.key) return false
        
        if (criteria.minTempo && song.tempo && song.tempo < parseInt(criteria.minTempo)) return false
        if (criteria.maxTempo && song.tempo && song.tempo > parseInt(criteria.maxTempo)) return false
        
        if (criteria.difficulty && song.difficulty !== criteria.difficulty) return false
        
        if (criteria.tags && criteria.tags.length > 0) {
          if (!criteria.tags.some((tag: string) => song.tags.includes(tag))) return false
        }
        
        if (criteria.chords && criteria.chords.length > 0) {
          const songContent = song.sections
            .flatMap(s => s.blocks)
            .filter(b => b.type === 'chords')
            .map(b => b.content)
            .join(' ')
          
          if (!criteria.chords.some((chord: string) => songContent.includes(chord))) return false
        }
        
        if (criteria.artist && song.artist && !song.artist.toLowerCase().includes(criteria.artist.toLowerCase())) return false
        
        if (criteria.keywords && criteria.keywords.length > 0) {
          const searchText = `${song.title} ${song.artist} ${song.description} ${song.tags.join(' ')}`.toLowerCase()
          if (!criteria.keywords.some((kw: string) => searchText.includes(kw.toLowerCase()))) return false
        }
        
        return true
      })
      
      setResults(filtered)
      
      if (filtered.length === 0) {
        toast.info('No songs match your search criteria')
      } else {
        toast.success(`Found ${filtered.length} song${filtered.length > 1 ? 's' : ''}`)
      }
      
    } catch (error) {
      toast.error('Search failed. Try a simpler query.')
      console.error(error)
      
      const fallbackResults = songs.filter(song =>
        song.title.toLowerCase().includes(query.toLowerCase()) ||
        song.artist?.toLowerCase().includes(query.toLowerCase())
      )
      setResults(fallbackResults)
      setSearchIntent('Basic text search')
    } finally {
      setIsSearching(false)
    }
  }

  const handleBasicSearch = () => {
    const filtered = songs.filter(song =>
      song.title.toLowerCase().includes(query.toLowerCase()) ||
      song.artist?.toLowerCase().includes(query.toLowerCase()) ||
      song.key?.toLowerCase().includes(query.toLowerCase()) ||
      song.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
    )
    setResults(filtered)
    setSearchIntent('Basic keyword search')
  }

  const handleClear = () => {
    setQuery('')
    setResults([])
    setSearchIntent('')
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <MagnifyingGlass 
                size={20} 
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" 
              />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSmartSearch()}
                placeholder='Try "slow songs in the key of G" or "easy fingerstyle songs"'
                className="pl-10 pr-10"
              />
              {query && (
                <button
                  onClick={handleClear}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={handleSmartSearch}
              disabled={isSearching || !query.trim()}
              className="flex-1 gap-2"
            >
              <Sparkle size={18} weight={isSearching ? 'fill' : 'regular'} />
              {isSearching ? 'Searching...' : 'Smart Search'}
            </Button>
            <Button
              onClick={handleBasicSearch}
              disabled={!query.trim()}
              variant="outline"
            >
              <MagnifyingGlass size={18} />
            </Button>
          </div>

          {searchIntent && (
            <div className="text-sm text-muted-foreground italic">
              {searchIntent}
            </div>
          )}
        </div>
      </Card>

      {results.length > 0 && (
        <Card className="p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">
                {results.length} Result{results.length > 1 ? 's' : ''}
              </h3>
              <Button variant="ghost" size="sm" onClick={handleClear}>
                Clear
              </Button>
            </div>
            
            <ScrollArea className="h-96">
              <div className="space-y-2">
                {results.map(song => (
                  <Card
                    key={song.id}
                    className="p-3 hover:border-primary/50 cursor-pointer transition-colors"
                    onClick={() => onSelectSong?.(song.id)}
                  >
                    <div className="space-y-2">
                      <div>
                        <h4 className="font-semibold">{song.title}</h4>
                        {song.artist && (
                          <p className="text-sm text-muted-foreground">{song.artist}</p>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {song.key && (
                          <Badge variant="outline" className="text-xs">
                            Key: {song.key}
                          </Badge>
                        )}
                        {song.tempo && (
                          <Badge variant="outline" className="text-xs">
                            {song.tempo} BPM
                          </Badge>
                        )}
                        {song.difficulty && (
                          <Badge 
                            variant="outline" 
                            className="text-xs"
                          >
                            {song.difficulty}
                          </Badge>
                        )}
                        {song.tags.slice(0, 3).map(tag => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>
        </Card>
      )}
    </div>
  )
}
