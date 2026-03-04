export const DB_KEYS = {
  songsIndex: "songs:index", // array of {id,title,updatedAt}
  song: (id: string) => `song:${id}`,
  favorites: "favorites", // {songs:string[], chords:string[]}
  setlists: "setlists", // array
  recordingsIndex: "recordings:index",
  recording: (id: string) => `recording:${id}`,
  transcriptionsIndex: "transcriptions:index", // array of {id,createdAt,sourceFileName?,sourceRecordingId?}
  transcription: (id: string) => `transcription:${id}`,
} as const;
