import type { Song, Section, Block } from '@/types'

/**
 * Converts a Song object to ChordPro format string
 */
export function exportToChordPro(song: Song): string {
  const lines: string[] = []

  // Header metadata
  if (song.title) lines.push(`{title: ${song.title}}`)
  if (song.artist) lines.push(`{artist: ${song.artist}}`)
  if (song.key) lines.push(`{key: ${song.key}}`)
  if (song.tempo) lines.push(`{tempo: ${song.tempo}}`)
  if (song.timeSignature) lines.push(`{time: ${song.timeSignature}}`)

  lines.push('') // Empty line after headers

  // Process each section
  song.sections.forEach(section => {
    // Section header
    lines.push(`[${section.name}]`)

    // Process blocks in this section
    section.blocks.forEach(block => {
      if (block.type === 'lyrics') {
        // For lyrics blocks, combine with chord blocks if they exist
        const chordBlock = section.blocks.find(b => b.type === 'chords' && b.id === block.chordBlockId)
        if (chordBlock && chordBlock.content) {
          // Interleave chords and lyrics
          const chordLines = chordBlock.content.split('\n')
          const lyricLines = block.content.split('\n')

          const maxLines = Math.max(chordLines.length, lyricLines.length)
          for (let i = 0; i < maxLines; i++) {
            const chordLine = chordLines[i] || ''
            const lyricLine = lyricLines[i] || ''

            if (chordLine.trim()) {
              lines.push(`[${chordLine}]`)
            }
            if (lyricLine.trim()) {
              lines.push(lyricLine)
            }
          }
        } else {
          // Just lyrics
          lines.push(block.content)
        }
      } else if (block.type === 'chords' && !block.chordBlockId) {
        // Standalone chord block
        lines.push(`[${block.content}]`)
      }
      // Skip other block types or chord blocks that are paired with lyrics
    })

    lines.push('') // Empty line between sections
  })

  return lines.join('\n')
}

/**
 * Parses ChordPro format string into a Song object
 */
export function importFromChordPro(chordProText: string): Song {
  const lines = chordProText.split('\n')
  const song: Partial<Song> = {
    id: `song_${Date.now()}`,
    title: '',
    artist: '',
    key: '',
    tempo: 120,
    timeSignature: '4/4',
    sections: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }

  let currentSection: Section | null = null
  let currentChordLine = ''
  let currentLyricLine = ''

  for (const line of lines) {
    const trimmed = line.trim()

    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      // Metadata line
      const meta = trimmed.slice(1, -1).split(':').map(s => s.trim())
      if (meta.length === 2) {
        const [key, value] = meta
        switch (key.toLowerCase()) {
          case 'title':
            song.title = value
            break
          case 'artist':
            song.artist = value
            break
          case 'key':
            song.key = value
            break
          case 'tempo':
            song.tempo = parseInt(value) || 120
            break
          case 'time':
            song.timeSignature = value
            break
        }
      }
    } else if (trimmed.startsWith('[') && trimmed.endsWith(']') && !trimmed.includes(':')) {
      // Section header
      const sectionName = trimmed.slice(1, -1)
      currentSection = {
        id: `section_${Date.now()}_${Math.random()}`,
        name: sectionName,
        blocks: []
      }
      song.sections!.push(currentSection)
    } else if (trimmed.startsWith('[') && trimmed.endsWith(']') && trimmed.includes(':')) {
      // Chord line (not section header)
      currentChordLine = trimmed.slice(1, -1)
    } else if (trimmed && currentSection) {
      // Lyric line
      currentLyricLine = trimmed

      // Create blocks
      if (currentChordLine) {
        // Add chord block
        const chordBlock: Block = {
          id: `block_${Date.now()}_${Math.random()}`,
          type: 'chords',
          content: currentChordLine
        }
        currentSection.blocks.push(chordBlock)

        // Add lyric block linked to chord block
        const lyricBlock: Block = {
          id: `block_${Date.now()}_${Math.random()}`,
          type: 'lyrics',
          content: currentLyricLine,
          chordBlockId: chordBlock.id
        }
        currentSection.blocks.push(lyricBlock)

        currentChordLine = ''
      } else {
        // Just lyrics
        const lyricBlock: Block = {
          id: `block_${Date.now()}_${Math.random()}`,
          type: 'lyrics',
          content: currentLyricLine
        }
        currentSection.blocks.push(lyricBlock)
      }
    }
  }

  // Ensure we have at least one section
  if (song.sections!.length === 0) {
    song.sections!.push({
      id: `section_${Date.now()}`,
      name: 'Verse 1',
      blocks: []
    })
  }

  return song as Song
}