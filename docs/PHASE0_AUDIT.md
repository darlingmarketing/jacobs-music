# Phase 0 — Baseline Audit & Architecture Lock

## Framework & Toolchain

| Concern | Details |
|---|---|
| Framework | Vite + React 19 (SPA, no SSR) |
| Router | Custom state-based page switch in `App.tsx` (no React Router) |
| Styling | Tailwind CSS v4 + Radix UI primitives via shadcn/ui |
| Language | TypeScript 5.7 (`strictNullChecks: true`, no full strict mode) |
| State / Storage | `@github/spark` KV hooks (`useKV`) for current persistence |
| Build | `tsc -b --noCheck && vite build` — TypeScript errors do **not** block the build |

---

## Top-20 Breakpoints Found

| # | File | Issue | Fix Applied |
|---|---|---|---|
| 1 | `src/lib/chordDatabase.ts` | Fret values are strings (`'x'`) assigned to `number` fields; `baseFret` missing on 10+ voicings | Pre-existing; out of scope for Phase 0 |
| 2 | `src/components/AudioRecorder.tsx:79` | `NodeJS.Timeout` used — `NodeJS` namespace not available in browser TS config | Pre-existing |
| 3 | `src/components/SmartSearch.tsx:32,65` | References `spark` global (not imported/declared) — will be a runtime error | Pre-existing |
| 4 | `src/components/PlayMode.tsx:379` | `JSX` namespace used without import; `Tag` type resolves to `string|number|symbol` | Pre-existing |
| 5 | `src/components/ChordTimelineEditor.tsx:52` | Called with 0 args where 1 is required | Pre-existing |
| 6 | `src/components/FretboardDiagram.tsx:76` | Comparison between `number` and `string` literal | Pre-existing |
| 7 | `src/components/ui/chart.tsx` | `payload`/`label` props not in recharts v3 types; `.length`/`.map` on `{}` | Pre-existing |
| 8 | `src/types/index.ts` | `Song.tempo` uses `number`; `timeSignature` uses `string` — less structured than canonical schema | Superseded by new `src/lib/songbook/types.ts` |
| 9 | `src/lib/offline.ts` | Service worker path `/sw.js` not present in the repo | Pre-existing (no SW file) |
| 10 | `src/pages/Chords.tsx` & `src/pages/SongEditor.tsx` | Old pages imported nowhere (dead code — replaced by V2 variants) | Pre-existing |
| 11 | `src/lib/chordDatabaseNew.ts` | Parallel implementation of chord data with no consumers | Pre-existing |
| 12 | `src/lib/chordModels.ts` | Duplicate chord model types alongside `src/types/index.ts` | Pre-existing |
| 13 | No `src/lib/storage/` directory | `idb-keyval` not installed; no structured KV layer | **Fixed** — added `keys.ts` + `kv.ts` + installed `idb-keyval` |
| 14 | No `src/lib/songbook/` directory | No canonical Songbook schema with structured sections/blocks | **Fixed** — added `src/lib/songbook/types.ts` |
| 15 | `tsconfig.json` | `strict` mode not enabled (only `strictNullChecks`) | Noted — enabling full strict would break existing code |
| 16 | No smoke test / unit test setup | No `vitest`/`jest` configuration; no test files | Noted — stack uses Vite so Vitest is the natural fit |
| 17 | `src/hooks/useAutosave.ts` | Stores `SongVersion` snapshots using `useKV` (Spark KV) — tied to cloud, not local-first | Superseded by new `kvSet` storage layer |
| 18 | `src/lib/providers/index.ts` | `any` casts throughout MusicBrainz/LRCLIB parsers | Pre-existing |
| 19 | `package.json` | No `test` script defined | Pre-existing |
| 20 | `src/main.tsx` | No `ErrorBoundary` wrapping root render | Pre-existing (`ErrorFallback.tsx` exists but unused at root) |

---

## Architecture Changes Applied (Phase 0)

### New files

```
src/lib/songbook/types.ts   — Canonical Songbook domain types
src/lib/storage/keys.ts     — Centralised IndexedDB KV key constants
src/lib/storage/kv.ts       — Thin idb-keyval wrapper (kvGet/kvSet/kvDel/kvKeys)
docs/PHASE0_AUDIT.md        — This file
```

### Dependency added

| Package | Version | Purpose |
|---|---|---|
| `idb-keyval` | ^6.x | Lightweight IndexedDB key-value store |

### Folder conventions locked

| Path | Role |
|---|---|
| `src/lib/` | Domain logic (chords, audio, providers, storage, songbook) |
| `src/lib/songbook/` | Songbook schema + domain helpers |
| `src/lib/storage/` | Persistence layer (IndexedDB KV) |
| `src/components/` | Shared React UI components |
| `src/components/ui/` | shadcn/ui primitives (auto-generated — do not hand-edit) |
| `src/pages/` | Top-level page components (one per route) |
| `src/hooks/` | Shared React hooks |
| `src/types/` | Legacy type declarations (being superseded by `src/lib/songbook/types.ts`) |

---

## Build Status

```
✓ vite build passes (tsc --noCheck)
✓ idb-keyval installed (no known CVEs)
```

Pre-existing TypeScript errors (items 1–7 above) are unrelated to Phase 0 changes and left for a dedicated fix pass.
