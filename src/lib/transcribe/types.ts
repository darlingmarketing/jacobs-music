export type ChordSegment = {
  id: string;
  startMs: number;
  endMs: number;
  chord: string; // "Am", "G7", "F#dim"
  confidence?: number; // 0..1
};

export type TranscriptionResult = {
  id: string;
  sourceRecordingId?: string;
  sourceFileName?: string;
  tempoBpm?: number;
  key?: string;
  segments: ChordSegment[];
  createdAt: string; // ISO date
};
