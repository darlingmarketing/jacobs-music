import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { FretboardDiagram } from '@/components/FretboardDiagram'
import { CHORD_DATABASE, searchChords } from '@/lib/chordDatabase'
import { MagnifyingGlass, SpeakerHigh } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export function Chords() {
  const [search, setSearch] = useState('')
  const [leftHanded] = useKV<boolean>('leftHandedMode', false)
  const filteredChords = searchChords(search)

  const playChord = (chordName: string) => {
    console.log('Playing chord:', chordName)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Chord Library</h1>
      </div>

      <div className="relative">
        <MagnifyingGlass size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search chords (e.g., 'Gmaj7', 'Am', 'C')..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredChords.map(chord => (
          <Card key={chord.name} className="p-6">
            <Tabs defaultValue="0" className="w-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">{chord.name}</h3>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => playChord(chord.name)}
                  className="text-primary"
                >
                  <SpeakerHigh size={20} />
                </Button>
              </div>
              
              <TabsList className="w-full mb-4">
                {chord.voicings.map((_, index) => (
                  <TabsTrigger key={index} value={String(index)} className="flex-1">
                    {index + 1}
                  </TabsTrigger>
                ))}
              </TabsList>

              {chord.voicings.map((voicing, index) => (
                <TabsContent key={voicing.id} value={String(index)}>
                  <FretboardDiagram 
                    voicing={voicing} 
                    leftHanded={leftHanded}
                  />
                </TabsContent>
              ))}
            </Tabs>
          </Card>
        ))}
      </div>

      {filteredChords.length === 0 && search && (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">No chords found for "{search}"</p>
        </Card>
      )}
    </div>
  )
}
