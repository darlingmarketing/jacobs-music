export type ISODate = string;

export type TimeSignature = { beats: number; beatValue: number }; // e.g. {beats:4, beatValue:4}
export type Tuning = { name?: string; strings: string[] }; // e.g. ["E","A","D","G","B","E"]

export type SongMeta = {
  title: string;
  description?: string;
  artist?: string;
  key?: string; // e.g. "E minor", "C"
  tempoBpm?: number; // e.g. 120
  timeSignature?: TimeSignature;
  capo?: number; // 0-12
  tuning?: Tuning;
  tags?: string[];
  createdAt: ISODate;
  updatedAt: ISODate;
};

export type BlockBase = { id: string; type: string };

export type HeadingBlock = BlockBase & { type: "heading"; text: string };
export type NoteBlock = BlockBase & { type: "note"; markdown: string };

export type LyricsChordsBlock = BlockBase & {
  type: "lyrics_chords";
  /**
   * Supports chord-markup like:
   *   [G]Hello [D]world
   * or inline caret format:
   *   G^Hello D^world
   */
  source: string;
  renderMode?: "brackets" | "carets";
};

export type ChordGridBlock = BlockBase & {
  type: "chord_grid";
  /**
   * Example:
   *   | G | D | Em | C |
   */
  measures: Array<{ beats?: number; chords: string[] }>;
};

export type TabBlock = BlockBase & {
  type: "tab";
  tuning?: Tuning;
  ascii: string;
};

export type AudioRefBlock = BlockBase & {
  type: "audio_ref";
  recordingId: string;
  title?: string;
  notes?: string;
  startMs?: number;
  endMs?: number;
};

export type SongBlock =
  | HeadingBlock
  | LyricsChordsBlock
  | ChordGridBlock
  | TabBlock
  | NoteBlock
  | AudioRefBlock;

export type SongSection = {
  id: string;
  name: string; // Verse, Chorus, Bridge, etc.
  blocks: SongBlock[];
};

export type Song = {
  id: string;
  meta: SongMeta;
  sections: SongSection[];
};
