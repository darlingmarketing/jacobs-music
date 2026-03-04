import { useMemo, useCallback } from "react";
import { noteAtStringFret, noteIndex, intervalName, type NoteName } from "@/lib/music/notes";
import { audioEngine } from "@/lib/audioSynthesis";

// Open-string base frequencies for standard EADGBE (low E → high e)
const STANDARD_OPEN_FREQS = [82.41, 110.0, 146.83, 196.0, 246.94, 329.63];
// Note index of each standard open string
const STANDARD_NOTES: NoteName[] = ["E", "A", "D", "G", "B", "E"];

function openFreq(standardIdx: number, tuningNote: NoteName): number {
  const standardNote = STANDARD_NOTES[standardIdx];
  const semis = (noteIndex(tuningNote) - noteIndex(standardNote) + 12) % 12;
  // Adjust within ±6 semitones for nearest octave
  const adj = semis > 6 ? semis - 12 : semis;
  return STANDARD_OPEN_FREQS[standardIdx] * Math.pow(2, adj / 12);
}

interface FretboardProps {
  tuning?: NoteName[];
  fretCount?: number;
  highlightedNotes?: Set<NoteName>;
  rootNote?: NoteName;
  scaleIntervals?: number[];
  showNoteNames?: boolean;
  leftHanded?: boolean;
  className?: string;
}

const FRET_DOTS = new Set([3, 5, 7, 9, 12]);

const PAD_TOP = 26;
const PAD_BOTTOM = 14;
const PAD_LEFT = 24;
const PAD_RIGHT = 10;
const FRET_W = 46;
const STR_H = 22;
const NUT_X = PAD_LEFT + 16;
const DOT_R = 8;

export function Fretboard({
  tuning = ["E", "A", "D", "G", "B", "E"],
  fretCount = 12,
  highlightedNotes,
  rootNote,
  scaleIntervals,
  showNoteNames = true,
  leftHanded = false,
  className,
}: FretboardProps) {
  const numStrings = tuning.length;

  // Display order: high string at top, low string at bottom.
  // Standard: displayIdx 0 = stringIdx (numStrings-1), displayIdx (numStrings-1) = stringIdx 0
  // Left-handed: reverse (low string at top)
  const displayStrings: NoteName[] = useMemo(() => {
    const arr = leftHanded ? [...tuning] : [...tuning].reverse();
    return arr;
  }, [tuning, leftHanded]);

  const svgWidth = NUT_X + fretCount * FRET_W + PAD_RIGHT;
  const svgHeight = PAD_TOP + (numStrings - 1) * STR_H + PAD_BOTTOM + 10;

  const playNote = useCallback(
    (displayStringIdx: number, fret: number) => {
      const actualStringIdx = leftHanded
        ? displayStringIdx
        : numStrings - 1 - displayStringIdx;
      const base = openFreq(actualStringIdx, tuning[actualStringIdx]);
      const freq = base * Math.pow(2, fret / 12);
      audioEngine.playFrequency(freq, 1.2);
    },
    [tuning, leftHanded, numStrings],
  );

  const stringY = (displayIdx: number) =>
    PAD_TOP + displayIdx * STR_H;

  const fretX = (fret: number) => NUT_X + (fret - 0.5) * FRET_W;

  return (
    <div className={className} style={{ overflowX: "auto" }}>
      <svg
        width={svgWidth}
        height={svgHeight}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        aria-label="Guitar fretboard"
      >
        {/* Fret number labels */}
        {Array.from({ length: fretCount }, (_, fi) => {
          const f = fi + 1;
          if (!FRET_DOTS.has(f)) return null;
          return (
            <text
              key={`fn-${f}`}
              x={NUT_X + (f - 0.5) * FRET_W}
              y={PAD_TOP - 6}
              fontSize={10}
              textAnchor="middle"
              fill="currentColor"
              opacity={0.5}
            >
              {f}
            </text>
          );
        })}

        {/* Nut */}
        <line
          x1={NUT_X}
          y1={stringY(0)}
          x2={NUT_X}
          y2={stringY(numStrings - 1)}
          stroke="currentColor"
          strokeWidth={4}
        />

        {/* Fret lines */}
        {Array.from({ length: fretCount }, (_, fi) => {
          const f = fi + 1;
          return (
            <line
              key={`fl-${f}`}
              x1={NUT_X + f * FRET_W}
              y1={stringY(0)}
              x2={NUT_X + f * FRET_W}
              y2={stringY(numStrings - 1)}
              stroke="currentColor"
              strokeWidth={1.2}
              opacity={0.4}
            />
          );
        })}

        {/* String lines */}
        {displayStrings.map((_, di) => (
          <line
            key={`sl-${di}`}
            x1={NUT_X}
            y1={stringY(di)}
            x2={NUT_X + fretCount * FRET_W}
            y2={stringY(di)}
            stroke="currentColor"
            strokeWidth={1 + (leftHanded ? di : numStrings - 1 - di) * 0.3}
            opacity={0.7}
          />
        ))}

        {/* String labels (open string name) */}
        {displayStrings.map((noteName, di) => (
          <text
            key={`sl-label-${di}`}
            x={NUT_X - 8}
            y={stringY(di)}
            fontSize={10}
            textAnchor="end"
            dominantBaseline="middle"
            fill="currentColor"
            opacity={0.6}
          >
            {noteName}
          </text>
        ))}

        {/* Dot position markers on fretboard body */}
        {[3, 5, 7, 9].map(f => (
          <circle
            key={`dot-${f}`}
            cx={NUT_X + (f - 0.5) * FRET_W}
            cy={stringY(Math.floor((numStrings - 1) / 2))}
            r={3}
            fill="currentColor"
            opacity={0.15}
          />
        ))}
        {[12].map(f => (
          [1, 3].map(i => (
            <circle
              key={`dot-${f}-${i}`}
              cx={NUT_X + (f - 0.5) * FRET_W}
              cy={stringY(i)}
              r={3}
              fill="currentColor"
              opacity={0.15}
            />
          ))
        ))}

        {/* Note dots */}
        {displayStrings.map((openNote, di) => {
          const actualStringIdx = leftHanded ? di : numStrings - 1 - di;
          return Array.from({ length: fretCount + 1 }, (_, fret) => {
            const note = noteAtStringFret(displayStrings, di, fret);
            const inScale = highlightedNotes ? highlightedNotes.has(note) : true;
            const isRoot = rootNote ? note === rootNote : false;

            if (!inScale) return null;

            const cx = fret === 0 ? NUT_X - 12 : fretX(fret);
            const cy = stringY(di);

            const label = showNoteNames
              ? note
              : rootNote && scaleIntervals
                ? intervalName(rootNote, note)
                : note;

            return (
              <g
                key={`note-${di}-${fret}`}
                onClick={() => playNote(di, fret)}
                style={{ cursor: "pointer" }}
                role="button"
                aria-label={`${note} on string ${actualStringIdx + 1} fret ${fret}`}
              >
                <circle
                  cx={cx}
                  cy={cy}
                  r={DOT_R}
                  fill={isRoot ? "hsl(var(--primary))" : "hsl(var(--secondary))"}
                  stroke={isRoot ? "hsl(var(--primary))" : "hsl(var(--border))"}
                  strokeWidth={1}
                />
                <text
                  x={cx}
                  y={cy}
                  fontSize={label.length > 2 ? 6 : 7}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={isRoot ? "hsl(var(--primary-foreground))" : "hsl(var(--secondary-foreground))"}
                  style={{ pointerEvents: "none", userSelect: "none" }}
                >
                  {label}
                </text>
              </g>
            );
          });
        })}
      </svg>
    </div>
  );
}
