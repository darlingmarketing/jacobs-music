import type { Song, SongAnalysis, ChordProgression } from '@/types'
import { parseChord } from './chordParser'

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const MAJOR_SCALE = [0, 2, 4, 5, 7, 9, 11]
const MINOR_SCALE = [0, 2, 3, 5, 7, 8, 10]

function getNoteIndex(note: string): number {
  const normalized = note.replace(/b/, '#').replace('Db', 'C#').replace('Eb', 'D#')
    .replace('Gb', 'F#').replace('Ab', 'G#').replace('Bb', 'A#')
  return NOTE_NAMES.indexOf(normalized.substring(0, note.includes('#') ? 2 : 1))
}

function extractChordsFromSong(song: Song): string[] {
  const chords: string[] = []
  
  for (const section of song.sections) {
    for (const block of section.blocks) {
      if (block.type === 'chords') {
        const lines = block.content.split('\n')
        for (const line of lines) {
          const chordMatches = line.match(/\b[A-G][#b]?(?:m|maj|min|dim|aug|sus|add|[0-9])*(?:\/[A-G][#b]?)?\b/g)
          if (chordMatches) {
            chords.push(...chordMatches)
          }
        }
      }
    }
  }
  
  return chords
}

function findChordProgressions(chords: string[]): ChordProgression[] {
  const progressions = new Map<string, ChordProgression>()
  const windowSize = 4
  
  for (let i = 0; i <= chords.length - windowSize; i++) {
    const progression = chords.slice(i, i + windowSize)
    const key = progression.join('-')
    
    if (progressions.has(key)) {
      const existing = progressions.get(key)!
      existing.frequency++
    } else {
      progressions.set(key, {
        chords: progression,
        frequency: 1
      })
    }
  }
  
  return Array.from(progressions.values())
    .filter(p => p.frequency >= 2)
    .sort((a, b) => b.frequency - a.frequency)
}

function calculateHarmonicComplexity(chords: string[]): number {
  const uniqueChords = new Set(chords)
  const uniqueRoots = new Set<string>()
  let extendedChordsCount = 0
  
  for (const chord of chords) {
    const parsed = parseChord(chord)
    if (parsed.isValid && parsed.root) {
      uniqueRoots.add(parsed.root)
      if (parsed.quality && (parsed.quality.includes('7') || parsed.quality.includes('9') || 
          parsed.quality.includes('11') || parsed.quality.includes('13') || 
          parsed.quality.includes('sus') || parsed.quality.includes('add'))) {
        extendedChordsCount++
      }
    }
  }
  
  const uniqueScore = uniqueChords.size / Math.max(1, chords.length) * 100
  const chromaticScore = uniqueRoots.size / 12 * 100
  const extensionScore = extendedChordsCount / Math.max(1, chords.length) * 100
  
  return Math.round((uniqueScore * 0.4 + chromaticScore * 0.3 + extensionScore * 0.3))
}

function detectKey(chords: string[]): { key: string; confidence: number } | null {
  if (chords.length === 0) return null
  
  const rootNotes = chords
    .map(c => parseChord(c))
    .filter(p => p.isValid && p.root)
    .map(p => p.root!)
  
  const rootCounts = new Map<string, number>()
  for (const root of rootNotes) {
    rootCounts.set(root, (rootCounts.get(root) || 0) + 1)
  }
  
  const sortedRoots = Array.from(rootCounts.entries())
    .sort((a, b) => b[1] - a[1])
  
  if (sortedRoots.length === 0) return null
  
  const likelyKey = sortedRoots[0][0]
  const confidence = Math.min(100, Math.round((sortedRoots[0][1] / rootNotes.length) * 100))
  
  return { key: likelyKey, confidence }
}

function generateAlternateChords(chords: string[]): { original: string; alternatives: string[] }[] {
  const uniqueChords = Array.from(new Set(chords))
  const suggestions: { original: string; alternatives: string[] }[] = []
  
  for (const chord of uniqueChords.slice(0, 10)) {
    const parsed = parseChord(chord)
    if (!parsed.isValid || !parsed.root) continue
    
    const alternatives: string[] = []
    
    if (!parsed.quality || parsed.quality === 'major' || parsed.quality === '') {
      alternatives.push(`${parsed.root}maj7`, `${parsed.root}add9`, `${parsed.root}sus2`)
    } else if (parsed.quality === 'm' || parsed.quality === 'min') {
      alternatives.push(`${parsed.root}m7`, `${parsed.root}m9`, `${parsed.root}sus4`)
    } else if (parsed.quality === '7') {
      alternatives.push(`${parsed.root}9`, `${parsed.root}13`, `${parsed.root}7sus4`)
    }
    
    if (alternatives.length > 0) {
      suggestions.push({ original: chord, alternatives: alternatives.slice(0, 3) })
    }
  }
  
  return suggestions
}

export async function analyzeSongWithAI(song: Song): Promise<SongAnalysis> {
  const chords = extractChordsFromSong(song)
  const progressions = findChordProgressions(chords)
  const complexity = calculateHarmonicComplexity(chords)
  const keyDetection = detectKey(chords)
  const alternateChords = generateAlternateChords(chords)
  
  const sectionPatterns = song.sections.map(section => ({
    type: section.type,
    chordPattern: section.blocks
      .filter(b => b.type === 'chords')
      .map(b => b.content.split('\n')[0])
      .join(' | ')
  }))
  
  const repetitionScore = progressions.length > 0 
    ? Math.round((progressions[0].frequency / Math.max(1, chords.length / 4)) * 100)
    : 0
  
  const prompt = spark.llmPrompt`You are a music theory expert. Analyze this song and provide insights.

Song: ${song.title}${song.artist ? ` by ${song.artist}` : ''}
Key: ${song.key || keyDetection?.key || 'Unknown'}
Tempo: ${song.tempo || 'Unknown'} BPM
Chords used: ${chords.slice(0, 20).join(', ')}${chords.length > 20 ? '...' : ''}
${progressions.length > 0 ? `Most common progression: ${progressions[0].chords.join(' - ')}` : ''}
Harmonic complexity score: ${complexity}/100

Provide exactly 5 musical insights about this song as a JSON object with a single property "insights" containing an array of strings. Each insight should be 1-2 sentences. Focus on:
1. Chord progression patterns and their emotional impact
2. Key and harmonic choices
3. Song structure and repetition
4. Musical style or genre indicators
5. Notable harmonic features

Return only valid JSON in this exact format:
{
  "insights": ["insight 1", "insight 2", "insight 3", "insight 4", "insight 5"]
}`

  let insights: string[] = []
  try {
    const response = await spark.llm(prompt, 'gpt-4o-mini', true)
    const parsed = JSON.parse(response)
    insights = parsed.insights || []
  } catch (error) {
    insights = [
      `This song uses ${chords.length} chord changes throughout.`,
      `The harmonic complexity score is ${complexity}/100.`,
      keyDetection ? `The detected key is ${keyDetection.key} with ${keyDetection.confidence}% confidence.` : 'Key detection was inconclusive.',
      progressions.length > 0 ? `The progression ${progressions[0].chords.join('-')} appears ${progressions[0].frequency} times.` : 'No repeating progressions detected.',
      `The song has ${song.sections.length} sections.`
    ]
  }
  
  const practicePrompt = spark.llmPrompt`Based on this song analysis, provide exactly 3 specific practice recommendations as a JSON object.

Song: ${song.title}
Difficulty: ${song.difficulty || 'Unknown'}
Chords: ${chords.slice(0, 15).join(', ')}
Complexity: ${complexity}/100

Return only valid JSON in this exact format:
{
  "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"]
}

Each recommendation should be actionable and specific (1-2 sentences).`

  let practiceRecommendations: string[] = []
  try {
    const response = await spark.llm(practicePrompt, 'gpt-4o-mini', true)
    const parsed = JSON.parse(response)
    practiceRecommendations = parsed.recommendations || []
  } catch (error) {
    practiceRecommendations = [
      'Practice chord transitions slowly, focusing on smooth changes.',
      'Use a metronome to maintain consistent timing throughout the song.',
      complexity > 60 ? 'Break down complex chords into simpler voicings first.' : 'Focus on strumming patterns and rhythm variations.'
    ]
  }
  
  return {
    id: crypto.randomUUID(),
    songId: song.id,
    analyzedAt: new Date().toISOString(),
    detectedKey: keyDetection?.key,
    keyConfidence: keyDetection?.confidence,
    commonProgressions: progressions.slice(0, 5),
    harmonicComplexity: complexity,
    suggestedAlternateChords: alternateChords,
    structureAnalysis: {
      sections: sectionPatterns,
      repetitionScore
    },
    insights,
    practiceRecommendations
  }
}

export async function generateChordSuggestions(currentChords: string[], key?: string): Promise<string[]> {
  const prompt = spark.llmPrompt`You are a music theory expert. Given these chords in a progression, suggest the next 3 most likely chords.

Current progression: ${currentChords.join(' - ')}
${key ? `Key: ${key}` : ''}

Consider common progressions like:
- I-IV-V-I
- I-V-vi-IV
- ii-V-I
- I-vi-IV-V

Return only valid JSON in this exact format:
{
  "suggestions": ["chord1", "chord2", "chord3"]
}

Use standard chord notation (e.g., C, Am, G7, Dm).`

  try {
    const response = await spark.llm(prompt, 'gpt-4o-mini', true)
    const parsed = JSON.parse(response)
    return parsed.suggestions || []
  } catch (error) {
    return []
  }
}
