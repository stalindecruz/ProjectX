export interface Session {
  id: string
  ts: string
  score: number
  scoreLabel: string
  words: number
  duration: number
  wpm: number
  fillerPct: number
  fillerCounts: Record<string, number>
  excerpt: string
  tip: string
  mode: 'mic' | 'text'
}

export interface CoachResult {
  score: number
  scoreLabel: string
  summary: string
  strengths: string[]
  improvements: string[]
  tip: string
  fillerAnalysis: string
}

export interface Metrics {
  words: number
  fillers: number
  fillerPct: number
  wpm: number
  duration: number
}
