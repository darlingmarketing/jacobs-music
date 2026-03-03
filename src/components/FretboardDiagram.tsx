import { ChordVoicing } from '@/types'
import { cn } from '@/lib/utils'

interface FretboardDiagramProps {
  voicing: ChordVoicing
  chordName?: string
  leftHanded?: boolean
  className?: string
  onClick?: () => void
}

export function FretboardDiagram({ 
  voicing, 
  chordName,
  leftHanded = false, 
  className,
  onClick 
}: FretboardDiagramProps) {
  const strings = 6
  const visibleFrets = 5
  const baseFret = voicing.baseFret || 1
  
  const stringSpacing = 24
  const fretSpacing = 30
  const width = (strings - 1) * stringSpacing + 40
  const height = visibleFrets * fretSpacing + 40
  
  const frets = leftHanded ? [...voicing.frets].reverse() : voicing.frets
  const fingers = leftHanded && voicing.fingers ? [...voicing.fingers].reverse() : voicing.fingers

  return (
    <div 
      className={cn("inline-block", className)}
      onClick={onClick}
    >
      {chordName && (
        <div className="text-center font-semibold text-lg mb-2">{chordName}</div>
      )}
      <svg width={width} height={height} className="mx-auto">
        {Array.from({ length: strings }).map((_, i) => {
          const x = 20 + i * stringSpacing
          return (
            <line
              key={`string-${i}`}
              x1={x}
              y1={20}
              x2={x}
              y2={height - 20}
              stroke="currentColor"
              strokeWidth={i === 0 || i === strings - 1 ? 2 : 1.5}
              opacity={0.6}
            />
          )
        })}
        
        {Array.from({ length: visibleFrets + 1 }).map((_, i) => {
          const y = 20 + i * fretSpacing
          const isNut = baseFret === 1 && i === 0
          return (
            <line
              key={`fret-${i}`}
              x1={20}
              y1={y}
              x2={width - 20}
              y2={y}
              stroke="currentColor"
              strokeWidth={isNut ? 4 : 2}
              opacity={0.6}
            />
          )
        })}
        
        {frets.map((fret, stringIndex) => {
          const x = 20 + stringIndex * stringSpacing
          
          if (fret === 'x') {
            return (
              <g key={`marker-${stringIndex}`}>
                <line
                  x1={x - 4}
                  y1={8}
                  x2={x + 4}
                  y2={16}
                  stroke="currentColor"
                  strokeWidth={2}
                />
                <line
                  x1={x + 4}
                  y1={8}
                  x2={x - 4}
                  y2={16}
                  stroke="currentColor"
                  strokeWidth={2}
                />
              </g>
            )
          }
          
          if (fret === 0) {
            return (
              <circle
                key={`marker-${stringIndex}`}
                cx={x}
                cy={12}
                r={4}
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              />
            )
          }
          
          const fretNum = typeof fret === 'number' ? fret : 0
          const displayFret = fretNum - baseFret + 1
          const y = 20 + displayFret * fretSpacing - fretSpacing / 2
          const finger = fingers?.[stringIndex]
          
          return (
            <g key={`marker-${stringIndex}`}>
              <circle
                cx={x}
                cy={y}
                r={8}
                fill="currentColor"
                className="fill-primary"
              />
              {finger !== null && finger !== undefined && (
                <text
                  x={x}
                  y={y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="text-xs font-bold fill-primary-foreground"
                >
                  {finger}
                </text>
              )}
            </g>
          )
        })}
        
        {baseFret > 1 && (
          <text
            x={10}
            y={20 + fretSpacing / 2}
            textAnchor="middle"
            dominantBaseline="central"
            className="text-xs fill-current opacity-70"
          >
            {baseFret}
          </text>
        )}
      </svg>
    </div>
  )
}
