import { CoachResult, Metrics } from '../types'

export async function analyzeSession(
  text: string,
  metrics: Metrics,
  fillerCounts: Record<string, number>,
  apiKey: string
): Promise<CoachResult> {
  const fillerSummary = Object.entries(fillerCounts)
    .filter(([, count]) => count > 0)
    .map(([word, count]) => `"${word}" x${count}`)
    .join(', ')

  const prompt = `You are an expert public speaking coach. Analyze this speech transcript and provide structured coaching feedback.

TRANSCRIPT:
"${text}"

METRICS:
- Word count: ${metrics.words}
- Duration: ${metrics.duration} seconds
- Speaking pace: ${metrics.wpm} WPM
- Filler words used: ${metrics.fillers} total (${metrics.fillerPct.toFixed(1)}% of words)
- Filler word breakdown: ${fillerSummary || 'none detected'}

Respond with ONLY a valid JSON object (no markdown, no code fences) in this exact format:
{
  "score": <integer 0-100>,
  "scoreLabel": "<one of: Excellent|Good|Fair|Needs Work>",
  "summary": "<2-3 sentence overall assessment>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "improvements": ["<improvement 1>", "<improvement 2>", "<improvement 3>"],
  "tip": "<one specific, actionable tip for next session>",
  "fillerAnalysis": "<1-2 sentences specifically about filler word usage>"
}

Scoring guide:
- 85-100: Excellent (minimal fillers, ideal pace, clear delivery)
- 70-84: Good (minor issues, mostly effective)
- 50-69: Fair (noticeable fillers or pace issues)
- 0-49: Needs Work (significant issues to address)`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '')
    if (response.status === 401) throw new Error('Invalid API key. Please check your Anthropic API key in Settings.')
    if (response.status === 429) throw new Error('Rate limit reached. Please wait a moment and try again.')
    if (response.status === 500) throw new Error('Anthropic API server error. Please try again shortly.')
    throw new Error(`API request failed (${response.status}): ${errorBody}`)
  }

  const data = await response.json()
  const rawText: string = data.content?.[0]?.text ?? ''
  const cleaned = rawText.replace(/```(?:json)?\n?/g, '').replace(/```/g, '').trim()

  try {
    return JSON.parse(cleaned) as CoachResult
  } catch {
    throw new Error('Failed to parse coaching response. Please try again.')
  }
}
