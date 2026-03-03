import { useState } from 'react'
import type { Song, SongAnalysis } from '@/types'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Brain, 
  ChartBar, 
  Lightbulb, 
  MusicNotes, 
  Target,
  Sparkle,
  ArrowsClockwise
} from '@phosphor-icons/react'
import { analyzeSongWithAI } from '@/lib/smartAnalysis'
import { toast } from 'sonner'

interface SongAnalysisPanelProps {
  song: Song
  analysis?: SongAnalysis
  onAnalysisComplete?: (analysis: SongAnalysis) => void
}

export function SongAnalysisPanel({ song, analysis: initialAnalysis, onAnalysisComplete }: SongAnalysisPanelProps) {
  const [analysis, setAnalysis] = useState<SongAnalysis | undefined>(initialAnalysis)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const handleAnalyze = async () => {
    setIsAnalyzing(true)
    toast.info('Analyzing song with AI...')
    
    try {
      const result = await analyzeSongWithAI(song)
      setAnalysis(result)
      onAnalysisComplete?.(result)
      toast.success('Analysis complete!')
    } catch (error) {
      toast.error('Failed to analyze song')
      console.error(error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const getComplexityColor = (score: number) => {
    if (score < 30) return 'bg-accent text-accent-foreground'
    if (score < 60) return 'bg-warning text-warning-foreground'
    return 'bg-primary text-primary-foreground'
  }

  const getComplexityLabel = (score: number) => {
    if (score < 30) return 'Simple'
    if (score < 60) return 'Moderate'
    return 'Complex'
  }

  if (!analysis) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Brain size={24} className="text-primary" />
            <h3 className="text-lg font-semibold font-display">AI Song Analysis</h3>
          </div>
          
          <p className="text-muted-foreground text-sm">
            Get intelligent insights about chord progressions, key detection, harmonic complexity, 
            and personalized practice recommendations powered by AI.
          </p>
          
          <Button 
            onClick={handleAnalyze} 
            disabled={isAnalyzing}
            className="w-full gap-2"
          >
            <Sparkle size={18} weight={isAnalyzing ? 'fill' : 'regular'} />
            {isAnalyzing ? 'Analyzing...' : 'Analyze Song with AI'}
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain size={24} className="text-primary" />
            <h3 className="text-lg font-semibold font-display">AI Analysis</h3>
          </div>
          <Button 
            onClick={handleAnalyze} 
            disabled={isAnalyzing}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <ArrowsClockwise size={16} />
            Re-analyze
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Detected Key
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">
                {analysis.detectedKey || 'Unknown'}
              </span>
              {analysis.keyConfidence && (
                <span className="text-sm text-muted-foreground">
                  {analysis.keyConfidence}%
                </span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Complexity
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">
                {analysis.harmonicComplexity}
              </span>
              <Badge className={getComplexityColor(analysis.harmonicComplexity)}>
                {getComplexityLabel(analysis.harmonicComplexity)}
              </Badge>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Repetition
            </div>
            <div className="text-2xl font-bold">
              {analysis.structureAnalysis.repetitionScore}%
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <ChartBar size={18} className="text-primary" />
            <h4 className="font-semibold">Common Progressions</h4>
          </div>
          
          {analysis.commonProgressions.length > 0 ? (
            <div className="space-y-2">
              {analysis.commonProgressions.slice(0, 3).map((prog, idx) => (
                <div 
                  key={idx}
                  className="p-3 bg-muted/50 rounded-md flex items-center justify-between"
                >
                  <div className="font-mono text-sm">
                    {prog.chords.join(' → ')}
                  </div>
                  <Badge variant="secondary">
                    ×{prog.frequency}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No repeating progressions detected</p>
          )}
        </div>

        <Separator />

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Lightbulb size={18} className="text-warning" />
            <h4 className="font-semibold">Musical Insights</h4>
          </div>
          
          <ScrollArea className="h-48">
            <ul className="space-y-2">
              {analysis.insights.map((insight, idx) => (
                <li key={idx} className="text-sm text-foreground/90 flex gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          </ScrollArea>
        </div>

        {analysis.suggestedAlternateChords.length > 0 && (
          <>
            <Separator />
            
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <MusicNotes size={18} className="text-accent" />
                <h4 className="font-semibold">Suggested Variations</h4>
              </div>
              
              <ScrollArea className="h-32">
                <div className="space-y-2">
                  {analysis.suggestedAlternateChords.slice(0, 5).map((suggestion, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      <Badge variant="outline">{suggestion.original}</Badge>
                      <span className="text-muted-foreground">→</span>
                      <div className="flex gap-1">
                        {suggestion.alternatives.map((alt, altIdx) => (
                          <Badge key={altIdx} className="bg-accent/10 text-accent-foreground border-accent/20">
                            {alt}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </>
        )}

        <Separator />

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Target size={18} className="text-secondary" />
            <h4 className="font-semibold">Practice Recommendations</h4>
          </div>
          
          <ul className="space-y-2">
            {analysis.practiceRecommendations.map((rec, idx) => (
              <li key={idx} className="text-sm text-foreground/90 flex gap-2 p-2 bg-secondary/10 rounded-md">
                <span className="text-secondary font-bold">{idx + 1}.</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="pt-2 text-xs text-muted-foreground text-center">
          Analyzed on {new Date(analysis.analyzedAt).toLocaleString()}
        </div>
      </div>
    </Card>
  )
}
