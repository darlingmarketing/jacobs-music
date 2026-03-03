# Planning Guide

Jacobs Music is a comprehensive mobile-first web application for guitarists to write, organize, and practice songs with integrated chord dictionary, discovery tools, and practice utilities.

**Experience Qualities**:
1. **Gig-ready** - Dark mode, large controls, distraction-free performance views designed for on-stage and practice scenarios
2. **Musician-focused** - Deeply integrated tools (transpose, capo helper, tuner, metronome) that feel like natural workflow extensions rather than separate utilities
3. **Effortless** - Autosave, offline access, and intuitive chord/lyric markup that gets out of the way so musicians can focus on creating

**Complexity Level**: Complex Application (advanced functionality, likely with multiple views)
This is a full-featured music creation and library management platform with authentication, external API integration, rich editing capabilities, audio synthesis, practice tools, and offline-first architecture requiring sophisticated state management and multiple interconnected views.

## Essential Features

**Song Editor**
- Functionality: Split-pane editor with live preview; supports title/metadata, chord lines, inline chord markup ([G]Hello), tabs, and section organization (Verse/Chorus/Bridge)
- Purpose: Core creative tool for capturing and refining song ideas with professional formatting
- Trigger: Click "New Song" from dashboard or edit existing song from library
- Progression: Enter title/metadata → Add sections → Type chords/lyrics with inline markup → Preview updates live → Auto-saves continuously → Explicit save commits changes
- Success criteria: Can create a complete song with multiple sections, chord changes, and tabs; preview accurately renders formatted output; no data loss on navigation

**Chord Library & Dictionary**
- Functionality: Searchable database of guitar chords with interactive fretboard diagrams, multiple voicings, finger positions, and tap-to-hear audio preview
- Purpose: Reference tool for discovering chord shapes and variations while writing or learning songs
- Trigger: Search chord name from /chords page or click chord tag in song preview
- Progression: Search/browse chord → View fretboard diagram with finger positions → Tap multiple voicings → Hear synthesized strum → Optionally add to song
- Success criteria: Find any common chord (major/minor/7th/sus/dim), view accurate diagrams, hear realistic preview, support left-handed mode

**Transpose & Capo Helper**
- Functionality: Transpose all chords in a song up/down by semitones; capo mode suggests simpler chord shapes for alternate fret positions
- Purpose: Adapt songs to comfortable vocal range and playing ability without manual chord calculation
- Trigger: Transpose buttons in song editor/preview; capo selector in metadata panel
- Progression: View song in original key → Click transpose +/- → All chords update instantly → Or set capo position → See simplified chord shapes with capo indicator
- Success criteria: Transposition preserves chord quality (G7 → A7 not A); capo mode shows easier shapes (barre F → open C with capo 5)

**Practice Mode with Loop & Speed Control**
- Functionality: Select song section, enable looping, adjust playback speed, and activate click-track/metronome synchronized to tempo
- Purpose: Focused practice on difficult passages with tempo trainer that gradually increases speed
- Trigger: Click "Practice" button in song view; select section to loop
- Progression: Open song → Enable practice mode → Select section (Verse 1) → Set loop → Adjust tempo 50-100% → Enable metronome → Practice → Gradually increase speed
- Success criteria: Section loops seamlessly, tempo adjustment is smooth, metronome stays in sync, speed trainer increments work correctly

**My Library & Setlists**
- Functionality: Personal collection of created songs and favorites; organize into setlists/folders; search/filter by tag, key, tuning, artist
- Purpose: Organize repertoire for gigs, practice sessions, and quick access to frequently played songs
- Trigger: Navigate to /library or /songs; create new setlist from library view
- Progression: View all songs/favorites → Filter by key/tag → Create setlist → Drag songs into setlist → Reorder → Access setlist during practice/gig
- Success criteria: Can find any saved song within 2 clicks; setlists persist and sync; filters work accurately; offline access maintained

**Discover & External Search**
- Functionality: Search external music databases (MusicBrainz, LRCLIB) for song metadata and lyrics; view results with source attribution; save favorites to library
- Purpose: Discover new songs and import basic metadata without copyright violations
- Trigger: Click "Discover" tab; enter artist/song search query
- Progression: Enter search term → View results with artist/title/year → Click result → See details + source link → Save to favorites → Optionally create local editable version
- Success criteria: Returns relevant results from multiple providers; clear attribution displayed; respects copyright (no scraped tabs); saves to library successfully

**Integrated Tools (Tuner & Metronome)**
- Functionality: Chromatic guitar tuner using device microphone; adjustable metronome with visual/audio click and subdivisions
- Purpose: Essential practice utilities accessible without leaving the app
- Trigger: Navigate to /tools or quick-access button from practice mode
- Progression: Tuner: Grant mic access → Pluck string → See note + cents sharp/flat → Tune to pitch | Metronome: Set BPM → Choose subdivision → Start/stop → Visual pulse + click sound
- Success criteria: Tuner accurately detects pitch within ±5 cents; metronome maintains steady tempo from 40-240 BPM; both work offline

**Autoscroll for Performance**
- Functionality: Automatically scroll lyrics/chords at adjustable speed during playback/performance
- Purpose: Hands-free reference while playing guitar on stage or during practice
- Trigger: Click "Autoscroll" button in song view; adjust speed slider
- Progression: Open song → Enable autoscroll → Set speed → Song scrolls smoothly → Tap to pause → Resume → Stop at end
- Success criteria: Smooth scrolling without jumps; speed adjusts in real-time; pause/resume works; compatible with full-screen mode

## Edge Case Handling

- **Empty States**: Graceful empty library with "Create Your First Song" CTA; empty search results suggest broader search or browse popular chords
- **Offline Mode**: Queue writes when offline; sync when reconnected; clear offline indicator; cached songs/favorites remain accessible
- **Invalid Chord Markup**: Highlight unrecognized chords in preview; suggest corrections; don't break rendering
- **Audio Permissions**: Clear prompts for microphone (tuner) and audio playback permissions; fallback UI if denied
- **Long Song Names**: Truncate with ellipsis in lists; full title on hover/detail view
- **Complex Chord Names**: Handle slash chords (D/F#), add notation (add9), and extended chords (maj13); normalize variations (Gmaj7 = GM7)
- **Export Failures**: Retry mechanism; download to local storage as fallback; clear error messaging
- **Concurrent Edits**: Last-write-wins with timestamp; show "last saved" indicator; warning if editing old version
- **Left-Handed Mode**: Persist preference; mirror all diagrams and tab displays; indicate mode in UI

## Design Direction

The design should evoke confidence, focus, and professionalism—a tool that feels equally at home in a bedroom studio and on a dark stage. The aesthetic should be bold and modern with a subtle nod to classic music notation (structured grids, clear hierarchy) while embracing digital interactivity. It should feel purposeful, not playful; refined, not sterile. Dark mode is the primary experience with high contrast for readability in low-light gig environments.

## Color Selection

A music-forward palette that balances warmth (creative energy) with cool professionalism (precision tools). Dark slate backgrounds for comfortable extended viewing; warm amber accents for interactive elements that feel tactile and inviting.

- **Primary Color**: Deep Amber `oklch(0.65 0.15 60)` - Warm, inviting action color that suggests vintage tube amps and stage lighting; communicates creativity and energy
- **Secondary Colors**: Charcoal Slate `oklch(0.25 0.02 240)` for secondary actions and muted backgrounds; Cool Blue-Gray `oklch(0.40 0.03 240)` for informational elements and metadata
- **Accent Color**: Bright Amber `oklch(0.75 0.18 55)` - High-energy highlight for CTAs, active states, and focus indicators; stands out on dark backgrounds
- **Foreground/Background Pairings**:
  - Background Dark `oklch(0.15 0.01 240)`: Light text `oklch(0.95 0.01 60)` - Ratio 12.8:1 ✓
  - Card Background `oklch(0.20 0.02 240)`: Light text `oklch(0.95 0.01 60)` - Ratio 11.2:1 ✓
  - Primary Amber `oklch(0.65 0.15 60)`: Dark text `oklch(0.10 0.01 240)` - Ratio 8.1:1 ✓
  - Accent Amber `oklch(0.75 0.18 55)`: Dark text `oklch(0.10 0.01 240)` - Ratio 10.5:1 ✓
  - Muted Slate `oklch(0.35 0.02 240)`: Light text `oklch(0.95 0.01 60)` - Ratio 4.9:1 ✓

## Font Selection

Typography should communicate precision and clarity—essential for reading chord charts and lyrics at a glance. A technical sans-serif conveys the tool-like nature of the app while maintaining warmth through careful weight selection. Monospace for tabs maintains perfect alignment.

- **Primary**: Space Grotesk - Geometric sans with subtle technical character; excellent readability at all sizes; conveys modern professionalism
- **Monospace**: JetBrains Mono - Designed for code but perfect for guitar tabs; clear character distinction; ligatures optional

**Typographic Hierarchy**:
- H1 (Page Title): Space Grotesk Bold / 32px / tight (-0.02em) letter spacing / leading 1.2
- H2 (Section Header): Space Grotesk SemiBold / 24px / normal letter spacing / leading 1.3
- H3 (Card/Component Title): Space Grotesk Medium / 18px / normal letter spacing / leading 1.4
- Body (Lyrics/UI): Space Grotesk Regular / 16px / normal letter spacing / leading 1.6
- Small (Metadata): Space Grotesk Regular / 14px / slight positive (0.01em) spacing / leading 1.5
- Chords (Preview): Space Grotesk SemiBold / 14px / wide (0.05em) spacing / leading 1.3
- Tabs: JetBrains Mono Regular / 14px / monospace / leading 1.4

## Animations

Animations should feel responsive and precise—like a well-maintained instrument. Subtle transitions guide attention during mode changes (editor → preview, practice mode activation) while micro-interactions provide tactile feedback on buttons and controls. Avoid flashy effects; favor functional clarity.

Use motion sparingly: smooth page transitions (300ms ease-out), button press feedback (100ms scale), chord diagram appearance (200ms fade-up), autoscroll with easing that mimics natural reading pace, and metronome visual pulse synchronized to audio beat. Practice mode activation should feel like "focusing in" with subtle dimming of non-essential UI and smooth section highlight.

## Component Selection

- **Components**:
  - Tabs (shadcn) for main navigation (Dashboard/Songs/Library/Discover/Chords/Tools)
  - Card (shadcn) for song list items, chord cards, and discovery results
  - Dialog (shadcn) for chord detail view, settings, and confirmations
  - Sheet (shadcn) for mobile navigation drawer and metadata panel
  - Button (shadcn) with custom amber theming; variants for primary/secondary/ghost
  - Input/Textarea (shadcn) for song editor, search fields
  - Select (shadcn) for key/tuning/capo dropdowns
  - Switch (shadcn) for toggles (autoscroll, metronome, left-handed mode)
  - Slider (shadcn) for tempo, scroll speed, volume controls
  - Badge (shadcn) for tags, chord labels, section indicators
  - Separator (shadcn) for section dividers in song preview
  - ScrollArea (shadcn) for long song lists and chord library
  - Accordion (shadcn) for collapsible song sections in editor

- **Customizations**:
  - **FretboardDiagram**: Custom SVG component rendering 6 strings, frets (0-12+), dots for finger positions, muted/open string indicators; supports left-handed mirroring
  - **ChordPlayer**: Audio synthesis wrapper using Web Audio API to generate simple guitar strum from chord voicing
  - **SongPreview**: Custom component rendering parsed chord/lyric markup with inline chord positioning above syllables
  - **TabDisplay**: Monospace pre-formatted block with horizontal scroll; preserves ASCII tab spacing
  - **Metronome**: Visual beat indicator (pulsing circle) + Web Audio click synthesis
  - **Tuner**: Real-time pitch detection using Web Audio AnalyserNode + autocorrelation; visual tuning meter
  - **AutoscrollContainer**: Smooth scroll wrapper with speed control; pause/resume on tap

- **States**:
  - Buttons: Default has subtle shadow; hover lifts slightly with border glow; active scales down 0.98; disabled at 50% opacity
  - Inputs: Default subtle border; focus ring with amber accent; error state with red border + shake animation
  - Cards: Default flat with border; hover elevates with shadow; selected state with amber left border accent
  - Chord diagrams: Default rendered; hover shows finger numbers; active plays audio with visual pulse
  - Toggle switches: Smooth 200ms transition; active shows amber background; includes haptic-style micro bounce

- **Icon Selection**:
  - MusicNotes (song/library), GuitarIcon (chords/tools), MagnifyingGlass (search/discover), Plus (new song), Pencil (edit), Play/Pause (practice mode), ArrowsClockwise (transpose), Faders (settings), ListBullets (setlists), Star (favorites), Download (offline), SpeakerHigh (audio preview), Metronome (tempo), Microphone (tuner)

- **Spacing**:
  - Page padding: `p-4` mobile, `p-6` tablet, `p-8` desktop
  - Card padding: `p-4` internal content
  - Section gaps: `gap-6` between major sections, `gap-4` between related groups
  - List items: `gap-2` between items, `py-3` vertical item padding
  - Form fields: `gap-4` between fields
  - Button groups: `gap-2` for tight clusters

- **Mobile**:
  - Navigation: Bottom tab bar on mobile (Dashboard/Songs/Library/Chords/Tools); top tabs on desktop
  - Editor: Stack vertically on mobile (editor full-width, preview below); side-by-side on tablet+
  - Song metadata: Collapsible drawer on mobile; persistent sidebar on desktop
  - Chord library: Single column grid on mobile; 2-3 columns on tablet+
  - Practice controls: Sticky footer on mobile with large touch targets; inline on desktop
  - Font size controls: Larger base sizes on mobile (18px body); adjustable zoom for accessibility
  - Autoscroll: Full-screen mode on mobile hides all chrome except pause button
