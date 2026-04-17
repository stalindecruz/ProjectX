import { FILLER_WORDS } from '../constants/fillerWords'
import { Metrics } from '../types'

export function countWords(text: string): number {
  return text.trim() === '' ? 0 : text.trim().split(/\s+/).length
}

export function detectFillers(text: string): { counts: Record<string, number>; total: number } {
  const lower = text.toLowerCase()
  const counts: Record<string, number> = {}
  let total = 0

  const multiWord = FILLER_WORDS.filter(f => f.includes(' '))
  const singleWord = FILLER_WORDS.filter(f => !f.includes(' '))

  let processed = lower

  for (const filler of multiWord) {
    const regex = new RegExp(`\\b${filler}\\b`, 'gi')
    const matches = processed.match(regex)
    if (matches && matches.length > 0) {
      counts[filler] = (counts[filler] ?? 0) + matches.length
      total += matches.length
      processed = processed.replace(regex, ' ')
    }
  }

  const words = processed.split(/\s+/).filter(Boolean)
  for (const word of words) {
    const clean = word.replace(/[^a-z]/g, '')
    if (singleWord.includes(clean)) {
      counts[clean] = (counts[clean] ?? 0) + 1
      total++
    }
  }

  return { counts, total }
}

export function calcWpm(words: number, seconds: number): number {
  if (seconds < 1) return 0
  return Math.round((words / seconds) * 60)
}

export function calcPaceStatus(wpm: number): 'slow' | 'ideal' | 'fast' {
  if (wpm < 120) return 'slow'
  if (wpm <= 160) return 'ideal'
  return 'fast'
}

export function buildMetrics(text: string, seconds: number): Metrics {
  const words = countWords(text)
  const { total: fillers } = detectFillers(text)
  const fillerPct = words > 0 ? (fillers / words) * 100 : 0
  const wpm = calcWpm(words, seconds)
  return { words, fillers, fillerPct, wpm, duration: seconds }
}
