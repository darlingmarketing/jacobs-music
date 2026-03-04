import { useState, useMemo, useRef, useCallback } from "react";
import { useKV } from "@github/spark/hooks";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Play } from "@phosphor-icons/react";
import { Fretboard } from "@/components/fretboard/Fretboard";
import { SCALES, scaleNotes } from "@/lib/music/scales";
import { normalizeNote, noteIndex, type NoteName } from "@/lib/music/notes";
import { audioEngine } from "@/lib/audioSynthesis";

const NOTE_NAMES: NoteName[] = [
  "C","C#","D","D#","E","F","F#","G","G#","A","A#","B",
];

const TUNING_PRESETS: { label: string; notes: NoteName[] }[] = [
  { label: "Standard (EADGBE)",  notes: ["E","A","D","G","B","E"] },
  { label: "Drop D (DADGBE)",    notes: ["D","A","D","G","B","E"] },
  { label: "Open G (DGDGBD)",    notes: ["D","G","D","G","B","D"] },
  { label: "DADGAD",             notes: ["D","A","D","G","A","D"] },
];

// Open-string frequencies for standard EADGBE (low E → high e)
const STANDARD_OPEN_FREQS = [82.41, 110.0, 146.83, 196.0, 246.94, 329.63];
const STANDARD_NOTES: NoteName[] = ["E","A","D","G","B","E"];

function openFreqForString(idx: number, note: NoteName): number {
  const semis = (noteIndex(note) - noteIndex(STANDARD_NOTES[idx]) + 12) % 12;
  const adj = semis > 6 ? semis - 12 : semis;
  return STANDARD_OPEN_FREQS[idx] * Math.pow(2, adj / 12);
}

export function ScaleExplorer() {
  const [root, setRoot] = useState<NoteName>("C");
  const [scaleId, setScaleId] = useState(SCALES[0].id);
  const [tuningIdx, setTuningIdx] = useState(0);
  const [showNoteNames, setShowNoteNames] = useState(true);
  const [leftHanded] = useKV<boolean>("leftHandedMode", false);
  const [bpm] = useState(80);
  const playingRef = useRef(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const scaleDef = useMemo(
    () => SCALES.find(s => s.id === scaleId) ?? SCALES[0],
    [scaleId],
  );

  const notes = useMemo(
    () => scaleNotes(root, scaleDef.intervals),
    [root, scaleDef],
  );

  const highlightedNotes = useMemo(() => new Set<NoteName>(notes), [notes]);
  const tuning = TUNING_PRESETS[tuningIdx].notes;

  const handlePlayScale = useCallback(async () => {
    if (isPlaying) {
      playingRef.current = false;
      setIsPlaying(false);
      return;
    }
    playingRef.current = true;
    setIsPlaying(true);

    const intervalMs = Math.round(60_000 / bpm);
    const freqs = notes.map((_, scaleIdx) => {
      // Play ascending on string 0 (low E) for simplicity
      const stringNote = tuning[0] as NoteName;
      const openF = openFreqForString(0, stringNote);
      const scaleNote = notes[scaleIdx];
      const diff = (noteIndex(scaleNote) - noteIndex(stringNote) + 24) % 12;
      return openF * Math.pow(2, diff / 12);
    });

    for (let i = 0; i < freqs.length; i++) {
      if (!playingRef.current) break;
      audioEngine.playFrequency(freqs[i], 0.4);
      await new Promise(r => setTimeout(r, intervalMs));
    }

    playingRef.current = false;
    setIsPlaying(false);
  }, [isPlaying, bpm, notes, tuning]);

  return (
    <div className="space-y-5">
      {/* Controls row */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Root note</Label>
          <Select value={root} onValueChange={v => setRoot(normalizeNote(v))}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {NOTE_NAMES.map(n => (
                <SelectItem key={n} value={n}>{n}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Scale</Label>
          <Select value={scaleId} onValueChange={setScaleId}>
            <SelectTrigger className="w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SCALES.map(s => (
                <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Tuning</Label>
          <Select
            value={String(tuningIdx)}
            onValueChange={v => setTuningIdx(Number(v))}
          >
            <SelectTrigger className="w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TUNING_PRESETS.map((t, i) => (
                <SelectItem key={t.label} value={String(i)}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Switch
            id="note-names-toggle"
            checked={showNoteNames}
            onCheckedChange={setShowNoteNames}
          />
          <Label htmlFor="note-names-toggle" className="text-sm cursor-pointer">
            {showNoteNames ? "Note names" : "Intervals"}
          </Label>
        </div>

        <Button
          variant={isPlaying ? "secondary" : "outline"}
          size="sm"
          onClick={handlePlayScale}
          className="gap-1"
        >
          <Play size={14} />
          {isPlaying ? "Stop" : "Play scale"}
        </Button>
      </div>

      {/* Scale notes info */}
      <div className="flex flex-wrap gap-1 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">
          {root} {scaleDef.label}:
        </span>
        {notes.map((n, i) => (
          <span key={i} className="font-mono text-primary">{n}</span>
        ))}
      </div>

      {/* Fretboard */}
      <div className="rounded-lg border bg-card p-3">
        <Fretboard
          tuning={tuning}
          fretCount={12}
          highlightedNotes={highlightedNotes}
          rootNote={root}
          scaleIntervals={scaleDef.intervals}
          showNoteNames={showNoteNames}
          leftHanded={leftHanded ?? false}
        />
      </div>
    </div>
  );
}
