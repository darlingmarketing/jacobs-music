# Jacobs Music - Complete Upgrade Implementation Plan

This document outlines the COMPLETE implementation required for the gig-ready songwriting app.

## Files Created So Far
1. ✅ `/src/types/index.ts` - Updated with new comprehensive types
2. ✅ `/src/lib/chordParser.ts` - Chord parsing & transposition
3. ✅ `/src/lib/audioSynthesis.ts` - Web Audio engine
4. ✅ `/src/lib/chordDatabaseNew.ts` - Complete chord database with voicings
5. ✅ `/src/components/FretboardDiagramNew.tsx` - Fretboard diagram renderer
6. ✅ `/src/components/Metronome.tsx` - Metronome component

## Files Still Needed (25+ additional files)

### Core Components Needed:
1. `/src/components/SongPreview.tsx` - Renders song with chords above lyrics
2. `/src/components/SectionEditor.tsx` - Edit individual song sections
3. `/src/components/BlockEditor.tsx` - Edit individual blocks (lyrics/chords/tabs/notes)
4. `/src/components/MetadataPanel.tsx` - Song metadata editing
5. `/src/components/TransposeControls.tsx` - Transpose +/- buttons
6. `/src/components/CapoHelper.tsx` - Capo suggestion logic
7. `/src/components/PlayMode.tsx` - Full-screen performance mode
8. `/src/components/AutoscrollContainer.tsx` - Auto-scrolling with speed control
9. `/src/components/PracticeLoop.tsx` - Loop section with count-in
10. `/src/components/ChordCard.tsx` - Single chord display with audio
11. `/src/components/SetlistManager.tsx` - Create/edit setlists
12. `/src/components/FavoriteButton.tsx` - Toggle favorite status

### Page Replacements Needed:
1. `/src/pages/SongEditorNew.tsx` - Complete rewrite with sections/blocks
2. `/src/pages/ChordsNew.tsx` - Searchable chord dictionary
3. `/src/pages/ToolsNew.tsx` - Metronome + Tuner stub
4. `/src/pages/MySongsNew.tsx` - Songs list with favorites
5. `/src/pages/LibraryNew.tsx` - Favorites + Setlists
6. `/src/pages/PlayModePage.tsx` - Dedicated play mode page
7. `/src/pages/DashboardNew.tsx` - Updated with recent songs

### Utility Libraries Needed:
1. `/src/lib/capoHelper.ts` - Capo position calculation
2. `/src/lib/tuningPresets.ts` - Guitar tuning definitions
3. `/src/lib/sectionTemplates.ts` - Common section structures
4. `/src/lib/offline.ts` - Service worker registration & caching

### Hooks Needed:
1. `/src/hooks/use-autosave.ts` - Debounced autosave
2. `/src/hooks/use-transpose.ts` - Transpose state management
3. `/src/hooks/use-autoscroll.ts` - Autoscroll logic
4. `/src/hooks/use-favorites.ts` - Favorites management
5. `/src/hooks/use-setlists.ts` - Setlist management

### Data/Seed:
1. Seed chord database to KV
2. Seed sample songs to KV
3. Seed tuning presets to KV

## Estimated Implementation Time
- Complete build: 15-20 hours of focused development
- Core MVP: 8-10 hours

## Current Status
The foundation is laid with:
- Type definitions complete
- Chord parser working
- Audio engine functional
- Basic components created

## Next Priority Steps
1. Create simplified SongEditor with basic section support
2. Build PlayMode with transpose
3. Integrate chord database into Chords page
4. Add metronome to Tools page
5. Implement favorites in MySongs

## Implementation Strategy
Due to the massive scope, I recommend an iterative approach:
- Phase 1: Song editing basics (sections, simple blocks)
- Phase 2: Play mode + transpose
- Phase 3: Chord dictionary integration
- Phase 4: Practice tools (metronome, loop)
- Phase 5: Library features (favorites, setlists)
- Phase 6: Offline/PWA

Each phase builds on the previous, delivering incremental value.
