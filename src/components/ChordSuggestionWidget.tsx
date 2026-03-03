import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Lightbulb, ArrowsClockwise } from '@phosphor-icons/react'
import { generateChordSuggestions } from '@/lib/smartAnalysis'

interface ChordSuggestionWidgetProps {
  currentChords: string[]
  songKey?: string
  onInsertChord?: (chord: string) => void
}

export function ChordSuggestionWidget({ currentChords, songKey, onInsertChord }: ChordSuggestionWidgetProps) {
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const handleGenerateSuggestions = async () => {
    if (currentChords.length === 0) return
    
    setIsLoading(true)
    try {
      const chords = await generateChordSuggestions(currentChords.slice(-4), songKey)
      setSuggestions(chords)
    } catch (error) {
      console.error('Failed to generate suggestions:', error)
      setSuggestions([])
    } finally {
      setIsLoading(false)
    }
  }

  if (currentChords.length === 0) {
    return null
  }

  return (
    <Card className="p-4 bg-gradient-to-br from-accent/5 to-accent/10 border-accent/20">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb size={18} className="text-accent" weight="fill" />
            <h4 className="font-semibold text-sm">Smart Suggestions</h4>
          </div>
          
          <Button
            onClick={handleGenerateSuggestions}
            disabled={isLoading}
            size="sm"
            variant="ghost"
            className="h-8 gap-1"
          >
            <ArrowsClockwise size={14} />
            {isLoading ? 'Thinking...' : 'Suggest'}
          </Button>
        </div>

        {suggestions.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              Based on your progression, try these next:
            </p>
            <div className="flex gap-2 flex-wrap">
              {suggestions.map((chord, idx) => (
                <Badge
                  key={idx}
                  className="bg-accent hover:bg-accent/80 cursor-pointer px-3 py-1.5 text-sm font-mono"
                  onClick={() => onInsertChord?.(chord)}
                >
                  {chord}
                </Badge>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            Click "Suggest" to get AI-powered chord recommendations
          </p>
        )}
      </div>
    </Card>
  )
}
