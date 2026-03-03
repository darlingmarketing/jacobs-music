import { ChordVoicing } from '@/types'
import { cn } from '@/lib/utils'

interface FretboardDiagramProps {
  voicing: ChordVoicing
  chordName?: string
  leftHanded?: boolean
  onClick?: () => void
  className?: string
}

export function FretboardDiagram({ voicing, chordName, leftHanded = false, onClick, className }: FretboardDiagramProps) {
  const { frets, fingers, baseFret } = voicing
  const numFrets = 5
  const numStrings = 6
  const fretWidth = 40
  const fretHeight = 50
  const nutWidth = 4

  const strings = leftHanded ? [...frets].reverse() : frets
  const fingerPositions = fingers && (leftHanded ? [...fingers].reverse() : fingers)

  const svgWidth = (numStrings - 1) * fretWidth + 40
  const svgHeight = numFrets * fretHeight + 60

  return (
    <div className={cn("inline-block", className)} onClick={onClick}>
      {chordName && (
        <div className="text-center font-semibold text-lg mb-2">{chordName}</div>
      )}
      <svg
        width={svgWidth}
        height={svgHeight}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="mx-auto"
      >
        {baseFret > 0 && (
          <text
            x="5"
            y={35 + fretHeight / 2}
            fontSize="14"
            fill="currentColor"
            className="font-mono"
          >
            {baseFret}fr
          </text>
        )}

        <line
          x1={20}
          y1={30}
          x2={20 + (numStrings - 1) * fretWidth}
          y2={30}
          stroke="currentColor"
          strokeWidth={baseFret === 0 ? nutWidth : 2}
        />

        {Array.from({ length: numFrets }).map((_, i) => (
          <line
            key={`fret-${i}`}
            x1={20}
            y1={30 + (i + 1) * fretHeight}
            x2={20 + (numStrings - 1) * fretWidth}
            y2={30 + (i + 1) * fretHeight}
            stroke="currentColor"
            strokeWidth={1.5}
            opacity={0.6}
          />
        ))}

        {Array.from({ length: numStrings }).map((_, i) => (
          <line
            key={`string-${i}`}
            x1={20 + i * fretWidth}
            y1={30}
            x2={20 + i * fretWidth}
            y2={30 + numFrets * fretHeight}
            stroke="currentColor"
            strokeWidth={1 + (i * 0.3)}
            opacity={0.8}
          />
        ))}

        {strings.map((fret, stringIndex) => {
          const x = 20 + stringIndex * fretWidth

          if (fret === -1) {
            return (
              <g key={`marker-${stringIndex}`}>
                <line
                  x1={x - 5}
                  y1={10}
                  x2={x + 5}
                  y2={20}
                  stroke="currentColor"
                  strokeWidth={2}
                />
                <line
                  x1={x + 5}
                  y1={10}
                  x2={x - 5}
                  y2={20}
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
                cy={15}
                r={5}
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              />
            )
          }

          const y = 30 + fret * fretHeight - fretHeight / 2
          const finger = fingerPositions?.[stringIndex]

          return (
            <g key={`marker-${stringIndex}`}>
              <circle
                cx={x}
                cy={y}
                r={12}
                fill="currentColor"
                className="fill-primary"
              />
              {finger && (
                <text
                  x={x}
                  y={y}
                  fontSize="12"
                  fontWeight="bold"
                  fill="white"
                  textAnchor="middle"
                  dominantBaseline="middle"
                >
                  {finger}
                </text>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}
