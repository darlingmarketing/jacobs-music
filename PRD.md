# Planning Guide

Jacobs Music is a comprehensive mobile-first web application for guitarists to write, organize, and practice songs with integrated chord dictionary, discovery tools, and practice utilities.


1. **Gig-ready** - Dark mode, large controls, distraction-free performance views designed for on-stage and practice scenarios
2. **Musician-focused** - Deeply integrated tools (transpose, capo helper, tuner, metronome) that feel like natural workflow extensions rather than separate utilities
3. **Effortless** - Autosave, offline access, and intuitive chord/lyric markup that gets out of the way so musicians can focus on creating

**Complexity Level**: Complex Application (advanced functionality, likely with multiple views)
This is a full-featured music creation and library management platform with authentication, external API integration, rich editing capabilities, audio synthesis, practice tools, and offline-first architecture requiring sophisticated state management and multiple interconnected views.

- Trigger: Search cho

**Transpose & C
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
- Progression: Tuner: Grant mic access → Pluck string → See note + cents sharp/flat → Tune to pitch | 
- Trigger: Transpose buttons in song editor/preview; capo selector in metadata panel
- Progression: View song in original key → Click transpose +/- → All chords update instantly → Or set capo position → See simplified chord shapes with capo indicator
- Success criteria: Transposition preserves chord quality (G7 → A7 not A); capo mode shows easier shapes (barre F → open C with capo 5)

**Practice Mode with Loop & Speed Control**
- **Empty States**: Graceful empty library with "Create Your First Song" CTA; empty search results suggest broader search or browse p
- **Invalid Chord Markup**: Highlight unrecognized chords in preview; suggest corrections; don't br
- **Long Song Names**: Truncate with ellipsis in lists; full title on h
- **Export Failures**: Retry mechanism; download to local storage as fallback; clear error messaging
- **Left-Handed Mode**: Persist preference; mirror all diagrams and tab displays; indicate mode in UI

The design should evoke c
## Color Selection
A music-forward palette that balances warmth (creative energy) with cool professionalism (precision too
- **Primary Color**: Deep Amber `oklch(0.65 0.15 60)` - Warm, inviting action c
- **Accent Color**: Bright Amber `oklch(0.75 0.18 55)` - High-energy highlight for CTAs, active states, and focus indicators; stands out on dark back
  - Background Dark `oklch(0.15 0.01 240)`: Light text `oklch(0.95 0.01 60)` - Ratio 12.8:1 ✓

  - Muted Slate `oklch(0.35 0.
## Font Selection
Typography should communicate precision and clarity—essential for reading chord char
- **Primary**: Space Grotesk - Geometric sans with subtle techn

- H1 (Page Title): Space Grotesk Bold / 32px / tight (-0.02em) letter spacing / leading 1.2

- Small (Metadata): Space Grotesk Regula
- Tabs: JetBrains Mono Regular / 14px / monospace / leading 1.4
## Animations
Animations should feel responsive and precise—like a well-maintained in
Use motion sparingly: smooth page transitions (300ms ease-out), button press feedback (100ms scale), chord diagram appearance (200ms fade-up), autoscroll with easing that mimics natur
## Component Selection

  - Card (shadcn) for song lis
  - Sheet (shadcn) for mobile navigation drawer and metadata panel
  - Input/Textarea (shadcn) for song editor, search fields
  - Switch (shadcn) for toggles (autoscroll, metronome, left-handed mo
  - Badge (shadcn) for tags, chord labels, section indicators
  - ScrollArea (shadcn) for long song lists and chord library

  - **FretboardDiagra

  - **Metronome**: Visual beat indicator (pulsing circle) + Web Audio click synthesis
  - **AutoscrollContainer**: Smooth scroll wrapper with speed control; pause/resume on tap
- **States**:
  - Inputs: Default subtle border; focus ring with amber accent; error state with red border + shake animation
  - Chord diagrams: Default rendered; hover shows finger numbers; active plays audio wi

- **Export Failures**: Retry mechanism; download to local storage as fallback; clear error messaging
- **Spacing**:
- **Left-Handed Mode**: Persist preference; mirror all diagrams and tab displays; indicate mode in UI

  - Button groups: 

  - Editor: Stack vertically on mobile (editor full-width, preview below); side-by-side on tablet+

## Color Selection







  - Background Dark `oklch(0.15 0.01 240)`: Light text `oklch(0.95 0.01 60)` - Ratio 12.8:1 ✓





## Font Selection







- H1 (Page Title): Space Grotesk Bold / 32px / tight (-0.02em) letter spacing / leading 1.2





- Tabs: JetBrains Mono Regular / 14px / monospace / leading 1.4

## Animations





## Component Selection





  - Sheet (shadcn) for mobile navigation drawer and metadata panel

  - Input/Textarea (shadcn) for song editor, search fields



  - Badge (shadcn) for tags, chord labels, section indicators

  - ScrollArea (shadcn) for long song lists and chord library







  - **Metronome**: Visual beat indicator (pulsing circle) + Web Audio click synthesis

  - **AutoscrollContainer**: Smooth scroll wrapper with speed control; pause/resume on tap

- **States**:

  - Inputs: Default subtle border; focus ring with amber accent; error state with red border + shake animation







- **Spacing**:

  - Card padding: `p-4` internal content







  - Editor: Stack vertically on mobile (editor full-width, preview below); side-by-side on tablet+





