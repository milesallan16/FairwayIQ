const BASE = import.meta.env.VITE_API_URL || '/api'

async function get(path) {
  const res = await fetch(`${BASE}${path}`)
  if (!res.ok) throw new Error(`API error ${res.status}`)
  return res.json()
}

export const api = {
  getPlayers:      ()             => get('/players/'),
  getCourses:      ()             => get('/courses/'),
  getCourse:       (id)           => get(`/courses/${id}`),
  getLeaderboard:  (courseId)     => get(`/predictions/${courseId}`),
  getMatchup:      (a,b,course)   => get(`/matchup/${course}/${a}/${b}`),
  getBestBets:     (courseId)     => get(`/bets/${courseId}`),
  runBacktest:     (courseId)     => get(`/backtest/?course_id=${courseId}`),
  optimizeWeights: (courseId)     => get(`/backtest/optimize?course_id=${courseId}`),
}

export async function getAIAnalysis(prompt) {
  const key = import.meta.env.VITE_ANTHROPIC_API_KEY
  if (!key) return 'Set VITE_ANTHROPIC_API_KEY in your .env to enable AI insights.'
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514', max_tokens: 300,
      system: 'You are a PGA Tour analytics expert. Give sharp, data-driven insights in 3-4 sentences. Be specific about SG metrics. No fluff.',
      messages: [{ role: 'user', content: prompt }]
    })
  })
  const data = await res.json()
  return data.content?.map(b => b.text || '').join('') || 'No response.'
}