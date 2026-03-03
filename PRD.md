# Planning Guide

Jacobs Music is a comprehensive Notion-like songwriting workspace for guitarists featuring block-based editing with slash commands, collaboration/sharing, and integrated audio ideas recording from device microphone.

**Experience Qualities**:
1. **Modular & Composable** - Notion-style block editor with slash commands allows musicians to rapidly assemble song structures using lyrics, chords, tabs, notes, and audio blocks
2. **Collaborative** - Share songs via private links with view/comment permissions, optional real-time co-editing, and version history to preserve creative iterations
3. **Capture-First** - Quick voice memo recording integrated into the workflow captures fleeting musical ideas instantly, attachable to specific song sections

**Complexity Level**: Complex Application (advanced functionality, likely with multiple views)

This is a full-featured music creation and collaboration platform with block-based editing, real-time collaboration, audio recording via MediaRecorder API, file system access, offline storage via IndexedDB, practice tools, and multi-view architecture requiring sophisticated state management.

## Essential Features

**Block-Based Composer (Notion-style)**
- Functionality: Unified block editor where each section contains reorderable blocks (lyrics, chords, tabs, notes, audio); slash commands (`/lyrics`, `/chords`, `/tab`, `/note`, `/audio`, `/divider`, `/heading`) for quick insertion; drag handles for reordering; Enter splits blocks; Backspace merges
- Purpose: Flexible, modular song composition that adapts to any workflow from simple chord sheets to complex arrangements with tabs and voice memos
- Trigger: Create new song or edit existing; type `/` in any block to open command menu; use keyboard shortcuts (Cmd/Ctrl+K) for quick insert
- Progression: Open Composer → Add sections (Verse/Chorus/etc) → Type `/` → Select block type → Fill content → Reorder blocks → Switch to Preview/Play Mode → Share or export
- Success criteria: Blocks can be created via slash commands; drag-and-drop reordering works; Enter/Backspace handle splits/merges; all block types render correctly in Preview and Play modes; inline chord tags `[G]` work in lyrics blocks; chord bars `| G | D | Em |` render properly

**Sharing & Collaboration**
- Functionality: Generate private share links with view or comment permissions; shared viewers see read-only song with play mode access; optional real-time co-editing with presence indicators and conflict resolution; comment threads anchored to sections/blocks; version history with restore capability
- Purpose: Enable band collaboration, remote songwriting sessions, and safe sharing with producers or collaborators without exposing songs publicly
- Trigger: Click "Share" button in song editor; choose permissions; copy link or invite via email
- Progression: Share link → Select permission level (view/comment/edit) → Generate token → Share URL → Recipients access read-only or collaborative view → Leave comments on sections → View/restore previous versions
- Success criteria: Share links work without authentication; view-only mode prevents edits; comment threads attach to correct blocks; version history shows timestamps and authors; restore reverts to previous snapshot

**Audio Ideas Recorder**
- Functionality: Record audio from device microphone using MediaRecorder API; controls for Record/Pause/Resume/Stop; in-app playback via `<audio>` element; add title, notes, tags; attach recording to song and specific section; save to device using File System Access API (best) or download fallback; optional IndexedDB storage for offline access
- Purpose: Capture fleeting musical ideas (melody humming, riff sketches, lyric phrasing) instantly without disrupting creative flow; link audio directly to song sections for reference during practice
- Trigger: Tap floating "Quick Record" button on dashboard or in song editor; or insert `/audio` block in Composer
- Progression: Tap record → Grant mic permission → Record audio (visual timer + level meter) → Pause/resume as needed → Stop → Play back → Add title/notes → Attach to song/section → Save to device (prompt Save As via File System Access API or auto-download) → Optional: store in IndexedDB for offline playback
- Success criteria: MediaRecorder captures audio from mic; permission errors show helpful guidance; recordings play back in-app; File System Access API triggers "Save As" dialog on supported browsers; fallback download works universally; recordings persist in IndexedDB; can attach/link to songs and sections; audio blocks appear in Composer

**Transpose & Capo Helper (Preserved from V2)**
- Functionality: Transpose all chords in a song up/down by semitones; capo mode suggests simpler chord shapes for alternate fret positions
- Purpose: Adapt songs to vocal range, simplify difficult barre chords, accommodate alternate tunings
- Trigger: Transpose buttons in song editor/preview; capo selector in metadata panel
- Progression: View song in original key → Click transpose +/- → All chords update instantly → Or set capo position → See simplified chord shapes with capo indicator
- Success criteria: Transposition preserves chord quality (G7 → A7 not A); capo mode shows easier shapes (barre F → open C with capo 5)

**Practice Mode with Loop & Autoscroll (Preserved from V2)**
- Functionality: Full-screen gig-ready view with large fonts, autoscroll with adjustable speed, section looping with count-in, metronome integration, tap tempo
- Purpose: Hands-free practice and live performance without needing to scroll or turn pages
- Trigger: Click "Play Mode" button in song editor
- Progression: Enter play mode → Start autoscroll → Adjust speed via slider → Select section to loop → Enable metronome → Practice with count-in → Jump between sections
- Success criteria: Autoscroll works smoothly at variable speeds; section loop repeats correctly; metronome stays in sync with BPM; dark mode optimized for stage use

**Chord Dictionary (Preserved from V2)**
- Functionality: Searchable database of guitar chords with interactive fretboard diagrams, multiple voicings, finger positions, and tap-to-hear audio preview
- Purpose: Reference tool for discovering chord shapes and variations while writing or learning songs
- Trigger: Search chord name from /chords page or click chord tag in song preview
- Progression: Search/browse chord → View fretboard diagram with finger positions → Tap multiple voicings → Hear synthesized strum → Optionally add to song
- Success criteria: Find any common chord (major/minor/7th/sus/dim), view accurate diagrams, hear realistic preview, support left-handed mode

## Edge Case Handling

**Empty States**
- Empty song library: "Create Your First Song" CTA with quick-start template options
- Empty audio ideas: "Record Your First Idea" prompt with mic permission guidance
- No collaborators: Invite flow with example use cases
- Empty section: Slash command hint overlay

**Microphone Permission Errors**
- Permission denied: Clear messaging with browser-specific instructions to enable mic access
- No microphone detected: Guide user to check device settings
- MediaRecorder not supported: Graceful degradation with explanation

**Collaboration Conflicts**
- Simultaneous edits: Last-write-wins with notification + version history restore option
- Offline edits: Sync conflict resolution UI when reconnecting
- Deleted shared songs: Show "Song no longer available" message

**Audio Recording Edge Cases**
- Long recordings (>10min): Warning + file size indicator
- Storage quota exceeded: Prompt to delete old recordings or download to free space
- Browser tab closed during recording: Attempt recovery via IndexedDB on reload
- Unsupported MIME type: Fallback through audio/webm → audio/ogg → audio/wav detection

**Block Editor Edge Cases**
- Empty block deletion: Backspace removes block when content is empty
- Last block protection: Cannot delete the only remaining block in a section
- Invalid chord markup in lyrics: Highlight but don't break rendering
- Drag to empty section: Allow drop and create placeholder

**File System Access Fallbacks**
- API not supported: Auto-download via blob URL + `<a download>`
- User cancels Save As: Keep recording in memory, allow retry
- Write permission denied: Fall back to download method

## Design Direction

The design should evoke creative energy, precision, and collaborative flow—a workspace that feels both technical and musical. The Notion-like block interface should feel lightweight and composable, with slash commands appearing instantly and blocks responding fluidly to drag-and-drop. Audio recording should feel integrated and unintrusive, not like a separate tool. Collaboration features should be discoverable but not overwhelming for solo users.

## Color Selection

A music-forward palette that balances warmth (creative energy) with cool professionalism (precision tools).

- **Primary Color**: Deep Amber `oklch(0.65 0.15 60)` - Warm, inviting action color for primary buttons, links, and brand elements
- **Secondary Color**: Dark Slate `oklch(0.25 0.02 240)` - Professional secondary actions and backgrounds
- **Accent Color**: Bright Amber `oklch(0.75 0.18 55)` - High-energy highlight for CTAs, active states, recording indicators, and focus rings; stands out on dark backgrounds
- **Background**: Deep Blue-Black `oklch(0.15 0.01 240)` - Immersive dark canvas reducing eye strain during long creative sessions
- **Card/Surface**: Slightly Lighter `oklch(0.20 0.02 240)` - Subtle elevation for blocks and panels

**Foreground/Background Pairings**:
- Background Dark `oklch(0.15 0.01 240)`: Light text `oklch(0.95 0.01 60)` - Ratio 12.8:1 ✓
- Primary Amber `oklch(0.65 0.15 60)`: Dark text `oklch(0.10 0.01 240)` - Ratio 8.2:1 ✓
- Accent Bright Amber `oklch(0.75 0.18 55)`: Dark text `oklch(0.10 0.01 240)` - Ratio 10.5:1 ✓
- Muted Slate `oklch(0.35 0.02 240)`: Light text `oklch(0.95 0.01 60)` - Ratio 7.1:1 ✓

## Font Selection

Typography should communicate precision and clarity—essential for reading chord charts while conveying creative energy.

- **Primary**: Space Grotesk - Geometric sans with subtle technical character, excellent readability for UI and content
- **Monospace**: JetBrains Mono - Code-aesthetic monospace for tabs and chord grids, clear character distinction

**Typographic Hierarchy**:
- H1 (Page Title): Space Grotesk Bold / 32px / tight (-0.02em) letter spacing / leading 1.2
- H2 (Section Headers): Space Grotesk Semibold / 24px / normal letter spacing / leading 1.3
- Body (Lyrics, Notes): Space Grotesk Regular / 16px / normal / leading 1.6
- Chords (Inline): Space Grotesk Semibold / 14px / wide (0.05em) / leading 1.4 / primary color
- Small (Metadata): Space Grotesk Regular / 13px / leading 1.4 / muted color
- Tabs: JetBrains Mono Regular / 14px / monospace / leading 1.4
- Slash Commands: JetBrains Mono Medium / 14px / accent color

## Animations

Animations should feel responsive and precise—like a well-maintained instrument responding instantly to touch.

Use motion purposefully:
- Slash command menu: 150ms fade-in + subtle slide-up (8px)
- Block reordering: Smooth position transitions (250ms) with spring physics
- Recording pulse: Gentle 1s ease-in-out scale for recording indicator
- Button press: 100ms scale (0.98) for tactile feedback
- Page transitions: 300ms ease-out fade
- Autoscroll: Continuous smooth scroll with configurable easing
- Audio waveform: Real-time visualization using Web Audio AnalyserNode (optional enhancement)
- Share link copy: 200ms success checkmark animation

## Component Selection

**Shadcn Components (Primary UI)**:
- Card for song lists, block containers, audio idea cards
- Sheet for mobile navigation drawer, metadata panel, share dialog
- Input/Textarea for inline block editing, search fields
- Button for all actions (primary, secondary, ghost variants)
- Select for dropdowns (key, tuning, time signature, block type)
- Switch for toggles (autoscroll, metronome, left-handed mode, offline availability)
- Badge for tags, chord labels, section type indicators, recording status
- ScrollArea for long song lists, chord library, version history
- Dialog for share settings, collaboration invite, delete confirmations
- Popover for slash command menu, quick actions, chord info tooltips
- Tabs for Edit/Preview/Play modes in song editor

**Custom Components (Domain-Specific)**:
- **BlockComposer**: Main Notion-like block editor with drag-and-drop
- **SlashCommandMenu**: Floating menu with /commands, keyboard navigable
- **AudioRecorder**: Mic recording UI with waveform/level meter, controls
- **AudioPlayer**: Playback controls for audio ideas with waveform
- **ShareDialog**: Link generation, permission settings, collaborator list
- **VersionHistory**: Timeline view with restore capability
- **CommentThread**: Anchored comments on blocks/sections
- **FretboardDiagram**: SVG guitar fretboard with voicing display (already exists)
- **Metronome**: Visual beat indicator + Web Audio synthesis (already exists)
- **AutoscrollContainer**: Smooth scroll wrapper with speed control
- **PracticeLoop**: Section looping with count-in

**States**:
- Inputs: Default subtle border; focus ring with amber accent; error state with red border + shake animation
- Buttons: Default solid; hover lift (2px) + brightness increase; active scale(0.98); disabled opacity 0.5
- Blocks: Default transparent; hover border-accent; focused border-primary + shadow; dragging opacity 0.6
- Recording button: Default amber; recording pulsing animation; paused amber/50; stopped returns to default
- Chord diagrams: Default rendered; hover shows finger numbers; active plays audio with pulse feedback

**Icon Selection**:
- Slash commands: `/` Lightning bolt icon
- Audio recording: Microphone, Pause, Stop, Waveform
- Collaboration: ShareNetwork, Users, ChatCircle, Clock (version history)
- Blocks: TextAa (lyrics), MusicNotes (chords), Code (tab), StickyNote (note), Waveform (audio)
- Reorder: DotsSixVertical drag handle
- Actions: Plus, Trash, Copy, Check, X

**Spacing**:
- Block editor: Each block `mb-2` between, `p-3` internal content, drag handle `-ml-8` outside
- Card padding: `p-4` internal content
- Section gaps: `gap-6` between major sections
- Button groups: `gap-2` horizontal, `gap-3` vertical
- Page margins: `p-6` on desktop, `p-4` on mobile

**Mobile Adaptations**:
- Editor: Stack vertically on mobile (editor full-width, preview below); side-by-side on tablet+
- Slash command menu: Full-width bottom sheet on mobile; floating popover on desktop
- Audio recorder: Fixed bottom sheet on mobile with backdrop; card modal on desktop
- Share dialog: Full-screen on mobile; centered dialog on desktop
- Navigation: Bottom tab bar on mobile (already exists); top horizontal nav on desktop
