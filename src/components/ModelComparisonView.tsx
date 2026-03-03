import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { ChordSegment, ModelPrediction } from '@/types/transcription'
import { CheckCircle, WarningCircle, XCircle, Brain } from '@phosphor-icons/react'

interface ModelComparisonViewProps {
  segments: ChordSegment[]
  onSegmentClick?: (segment: ChordSegment) => void
}

export function ModelComparisonView({ segments, onSegmentClick }: ModelComparisonViewProps) {
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.7) return 'text-accent'
    if (confidence >= 0.4) return 'text-warning'
    return 'text-destructive'
  }
  
  const getConfidenceBadgeVariant = (confidence: number): 'default' | 'secondary' | 'destructive' => {
    if (confidence >= 0.7) return 'default'
    if (confidence >= 0.4) return 'secondary'
    return 'destructive'
  }
  
  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 0.7) return <CheckCircle size={16} weight="fill" />
    if (confidence >= 0.4) return <WarningCircle size={16} weight="fill" />
    return <XCircle size={16} weight="fill" />
  }
  
  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.7) return 'High'
    if (confidence >= 0.4) return 'Medium'
    return 'Low'
  }
  
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm">
        <Brain size={18} className="text-primary" />
        <span className="font-medium">AI Model Predictions</span>
        <span className="text-muted-foreground">({segments.length} segments)</span>
      </div>
      
      <div className="grid gap-3">
        {segments.map((segment, idx) => {
          const hasModelVotes = segment.modelVotes && segment.modelVotes.length > 0
          const duration = ((segment.endMs - segment.startMs) / 1000).toFixed(1)
          
          return (
            <Card
              key={segment.id}
              className="p-4 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => onSegmentClick?.(segment)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-lg font-semibold text-primary">
                      {segment.chord}
                    </span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Badge 
                            variant={getConfidenceBadgeVariant(segment.confidence || 0)} 
                            className="gap-1"
                          >
                            {getConfidenceIcon(segment.confidence || 0)}
                            {getConfidenceLabel(segment.confidence || 0)}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="font-mono">{((segment.confidence || 0) * 100).toFixed(1)}% confidence</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <span className="text-xs text-muted-foreground">
                      {duration}s
                    </span>
                  </div>
                  
                  {hasModelVotes && (
                    <div className="grid grid-cols-3 gap-2">
                      {segment.modelVotes!.map((vote: ModelPrediction) => (
                        <div
                          key={vote.modelId}
                          className="flex flex-col gap-1 p-2 bg-muted/50 rounded-md"
                        >
                          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            {vote.modelId.replace('-', ' ')}
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-sm font-semibold">
                              {vote.chord}
                            </span>
                            <span className={`text-xs font-mono ${getConfidenceColor(vote.confidence)}`}>
                              {(vote.confidence * 100).toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="text-right text-xs text-muted-foreground space-y-1">
                  <div>{(segment.startMs / 1000).toFixed(2)}s</div>
                  <div>→</div>
                  <div>{(segment.endMs / 1000).toFixed(2)}s</div>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
