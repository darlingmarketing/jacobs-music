import type { TranscriptionResult } from "./types";
import { kvGet, kvSet } from "../storage/kv";
import { DB_KEYS } from "../storage/keys";

export type TranscriptionSummary = {
  id: string;
  createdAt: string;
  sourceFileName?: string;
  sourceRecordingId?: string;
};

export async function listTranscriptions(): Promise<TranscriptionSummary[]> {
  return (await kvGet<TranscriptionSummary[]>(DB_KEYS.transcriptionsIndex)) ?? [];
}

export async function getTranscription(
  id: string
): Promise<TranscriptionResult | undefined> {
  return kvGet<TranscriptionResult>(DB_KEYS.transcription(id));
}

export async function saveTranscription(result: TranscriptionResult): Promise<void> {
  await kvSet<TranscriptionResult>(DB_KEYS.transcription(result.id), result);

  const index = await listTranscriptions();
  const summary: TranscriptionSummary = {
    id: result.id,
    createdAt: result.createdAt,
    sourceFileName: result.sourceFileName,
    sourceRecordingId: result.sourceRecordingId,
  };
  const filtered = index.filter((s) => s.id !== result.id);
  await kvSet<TranscriptionSummary[]>(DB_KEYS.transcriptionsIndex, [
    summary,
    ...filtered,
  ]);
}
