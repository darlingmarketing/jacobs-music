# Jacobs Music - Notion-like Enhancements Implementation Roadmap

## Completed ✅

### 1. Updated Types (`/src/types/index.ts`)
- Added new block types: `audio`, `heading`, `divider`
- Added `AudioRecording` interface with storage types
- Added `ShareToken`, `Comment`, `SongVersion` interfaces for collaboration
- Added `SlashCommand` interface for Notion-like commands

### 2. Audio Recorder Component (`/src/components/AudioRecorder.tsx`)
- ✅ MediaRecorder API integration with mic access
- ✅ Record/Pause/Resume/Stop controls
- ✅ Real-time duration display
- ✅ Audio playback via `<audio>` element
- ✅ Title and notes metadata
- ✅ File System Access API integration with fallback download
- ✅ IndexedDB storage via useKV
- ✅ Link recordings to songs/sections
- ✅ Permission error handling with guidance
- ✅ Supported MIME type detection

### 3. Updated PRD
- Comprehensive requirements for block-based composer
- Sharing & collaboration specifications
- Audio ideas recorder details
- Edge case handling documentation

## In Progress 🚧

### 4. Block Composer Components
Next priority components to build:

#### A. SlashCommandMenu (`/src/components/SlashCommandMenu.tsx`)
- Floating menu triggered by `/`
- Keyboard navigation
- Command filtering
- Icons for each block type

#### B. BlockEditor (`/src/components/BlockEditor.tsx`)
- Inline editing for each block type
- Enter to split, Backspace to merge
- Focus management
- Block-specific rendering (lyrics, chords, tabs, notes, audio, heading, divider)

#### C. SectionComposer (`/src/components/SectionComposer.tsx`)
- Section list with drag-and-drop reordering
- Add/rename/duplicate/delete sections
- Block list per section
- Notion-like UX

### 5. Sharing & Collaboration Features

#### A. ShareDialog (`/src/components/ShareDialog.tsx`)
- Generate share link with token
- Permission selector (view/comment/edit)
- Copy link button
- Collaborator list (MVP: view-only)

#### B. VersionHistory (`/src/components/VersionHistory.tsx`)
- Timeline view of song snapshots
- Restore previous version
- Author and timestamp display

#### C. Comments (Phase 2)
- Comment threads anchored to blocks/sections
- Basic implementation for MVP

### 6. Enhanced Song Editor

#### SongEditorV3 (`/src/pages/SongEditorV3.tsx`)
- Replace current editor with block-based Composer
- Tabs: Edit | Preview | Play
- Metadata panel (keep from V2)
- Share button
- Audio recorder integration

## Not Started ⏳

### 7. Real-time Collaboration (Phase 2)
- Presence indicators
- Operational Transform or CRDT for conflict resolution
- WebSocket or polling-based sync

### 8. Testing
- Slash command insertion tests
- Block split/merge tests
- MediaRecorder mock tests
- File System Access fallback tests

## Implementation Strategy

**Phase 1 (Current Focus):**
1. ✅ Audio Recorder
2. 🚧 Slash Command Menu
3. 🚧 Block Editor
4. 🚧 Section Composer
5. 🚧 Song Editor V3 integration

**Phase 2:**
1. Share Dialog
2. Version History
3. Comments MVP

**Phase 3:**
1. Real-time collaboration
2. Advanced features (waveform visualization, etc.)

## Notes

- Keeping existing V2 features intact (transpose, capo, metronome, chord dictionary)
- Building incrementally to maintain working app at each stage
- Audio recorder is fully functional and can be integrated into editor
- Focus on core Notion-like editing experience before advanced collaboration

