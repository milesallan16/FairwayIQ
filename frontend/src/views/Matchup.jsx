import { useState, useEffect } from 'react'
import { api, getAIAnalysis } from '../api.js'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts'

const PLAYERS = [
  { id: 1, name: 'Scottie Scheffler' },
  { id: 2, name: 'Rory McIlroy' },
  { id: 3, name: 'Jon Rahm' },
  { id: 4, name: 'Xander Schauffele' },
  { id: 5, name: 'Viktor Hovland' },
  { id: 6, name: 'Collin Morikawa' },
  { id: 7, name: 'Patrick Cantlay' },
  { id: 8, name: 'Ludvig Åberg' },
]

function SGBar({ label, valA, valB, nameA, nameB, weight }) {
  const max = 1.5
  const wA = Math.round(Math.max(valA, 0) / max * 100)
  const wB = Math.round(Math.max(valB, 0) / max * 100)
  const edge = +(valA - valB).toFixed(2)
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>
        <span>{label} <span style={{ opacity: .6 }}>({Math.round(weight * 100)}% weight)</span></span>
        <span style={{ color: edge >= 0 ? 'var(--green)' : 'var(--gold)', fontFamily: 'var(--ff-mono)' }}>
          {edge >= 0 ? nameA.split(' ').pop() : nameB.split(' ').pop()} +{Math.abs(edge).toFixed(2)}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--green)', width: 34, textAlign: 'right' }}>{valA.toFixed(2)}</span>
        <div style={{ flex: 1, display: 'flex', gap: 2, alignItems: 'center' }}>
          <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ width: `${wA}%`, height: 8, background: 'var(--green)', borderRadius: 4 }} />
          </div>
          <div style={{ width: 1, height: 16, background: 'var(--border)' }} />
          <div style={{ flex: 1 }}>
            <div style={{ width: `${wB}%`, height: 8, background: 'var(--gold)', borderRadius: 4 }} />
          </div>
        </div>
        <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--gold)', width: 34 }}>{valB.toFixed(2)}</span>
      </div>
    </div>
  )
}

export default function Matchup({ courseId }) {
  const [playerA, setPlayerA] = useState(1)
  const [playerB, setPlayerB] = useState(2)
  const [result, setResult] = useState(null)
  const [aiText, setAiText] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => { runMatchup() }, [playerA, playerB, courseId])

  async function runMatchup() {
    if (playerA === playerB) return
    setLoading(true)
    setAiText('')
    try {
      const data = await api.getMatchup(playerA, playerB, courseId)
      setResult(data)
      const pa = data.player_a, pb = data.player_b
      getAIAnalysis(
        `Golf matchup at ${data.course}: ${pa.name} (fit score ${pa.fit_score}, SG Total +${pa.sg_stats.sg_total}, SG App +${pa.sg_stats.sg_app}) vs ${pb.name} (fit score ${pb.fit_score}, SG Total +${pb.sg_stats.sg_total}, SG App +${pb.sg_stats.sg_app}). Model: ${pa.name} ${pa.win_probability}% vs ${pb.name} ${pb.win_probability}%. Key edge: ${data.key_advantage_category} (+${data.key_advantage_edge}). Explain who wins and why in 3-4 sentences.`
      ).then(setAiText)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const radarData = result ? [
    { cat: 'OTT',  A: result.player_a.sg_stats.sg_ott,  B: result.player_b.sg_stats.sg_ott },
    { cat: 'APP',  A: result.player_a.sg_stats.sg_app,  B: result.player_b.sg_stats.sg_app },
    { cat: 'ARG',  A: result.player_a.sg_stats.sg_arg,  B: result.player_b.sg_stats.sg_arg },
    { cat: 'PUTT', A: result.player_a.sg_stats.sg_putt, B: result.player_b.sg_stats.sg_putt },
    { cat: 'Total',A: result.player_a.sg_stats.sg_total,B: result.player_b.sg_stats.sg_total },
  ] : []

  return (
    <div>
      {/* Player selectors */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 40px 1fr', gap: 10, alignItems: 'center', marginBottom: '1.25rem' }}>
        <div style={{ position: 'relative' }}>
          <select value={playerA} onChange={e => setPlayerA(+e.target.value)}>
            {PLAYERS.filter(p => p.id !== playerB).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: 'var(--muted)', pointerEvents: 'none' }}>▾</span>
        </div>
        <div style={{ textAlign: 'center', fontFamily: 'var(--ff-display)', color: 'var(--text-secondary)', fontSize: 16 }}>vs</div>
        <div style={{ position: 'relative' }}>
          <select value={playerB} onChange={e => setPlayerB(+e.target.value)}>
            {PLAYERS.filter(p => p.id !== playerA).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: 'var(--muted)', pointerEvents: 'none' }}>▾</span>
        </div>
      </div>

      {loading && <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}><span className="spinner" />Running matchup model...</div>}

      {!loading && result && (
        <>
          {/* Win probability cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            {[result.player_a, result.player_b].map((p, i) => {
              const isWinner = p.name === result.model_pick
              const color = i === 0 ? 'var(--green)' : 'var(--gold)'
              return (
                <div key={p.id} className="card" style={{ borderColor: isWinner ? 'var(--green)' : 'var(--border)', borderWidth: isWinner ? 2 : 0.5 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: '50%',
                      background: i === 0 ? 'var(--green-light)' : 'var(--gold-light)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 500, fontSize: 13, color
                    }}>
                      {p.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 500 }}>{p.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>World #{p.world_rank}</div>
                    </div>
                  </div>
                  <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 32, fontWeight: 500, color }}>{p.win_probability}%</div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 8 }}>win probability</div>
                  <div style={{ height: 6, background: '#f0f4f8', borderRadius: 3, overflow: 'hidden', marginBottom: 8 }}>
                    <div style={{ height: '100%', width: `${p.win_probability}%`, background: color, borderRadius: 3 }} />
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Fit Score: <span style={{ fontFamily: 'var(--ff-mono)', color: 'var(--text-primary)' }}>{p.fit_score}</span></div>
                  {isWinner && (
                    <div style={{ marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 500, padding: '3px 10px', borderRadius: 20, background: 'var(--green)', color: 'white' }}>
                      Model Pick
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            {/* SG bars */}
            <div className="card">
              <div className="card-title">SG Category Breakdown</div>
              {result.sg_breakdown.map(cat => (
                <SGBar key={cat.category}
                  label={cat.category}
                  valA={cat.player_a_val} valB={cat.player_b_val}
                  nameA={result.player_a.name} nameB={result.player_b.name}
                  weight={cat.course_weight}
                />
              ))}
              <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: 11 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--green)', display: 'inline-block' }} />{result.player_a.name.split(' ').pop()}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--gold)', display: 'inline-block' }} />{result.player_b.name.split(' ').pop()}</span>
              </div>
            </div>

            {/* Radar */}
            <div className="card">
              <div className="card-title">Radar Comparison</div>
              <ResponsiveContainer width="100%" height={200}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="cat" tick={{ fontSize: 11 }} />
                  <Radar name={result.player_a.name.split(' ').pop()} dataKey="A" stroke="#1a7a4a" fill="#1a7a4a" fillOpacity={0.25} />
                  <Radar name={result.player_b.name.split(' ').pop()} dataKey="B" stroke="#b8860b" fill="#b8860b" fillOpacity={0.20} />
                  <Tooltip contentStyle={{ fontSize: 11 }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Key stats summary */}
          <div className="card" style={{ marginBottom: '1rem' }}>
            <div className="card-title">Advantage Summary</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
              {result.sg_breakdown.map(cat => {
                const winner = cat.player_a_val >= cat.player_b_val ? result.player_a.name : result.player_b.name
                const edge = Math.abs(cat.weighted_edge).toFixed(3)
                const isA = cat.player_a_val >= cat.player_b_val
                return (
                  <div key={cat.category} style={{ background: '#f4f6f8', borderRadius: 8, padding: '0.75rem' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>{cat.category}</div>
                    <div style={{ fontWeight: 500, fontSize: 13, color: isA ? 'var(--green)' : 'var(--gold)' }}>{winner.split(' ').pop()}</div>
                    <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--text-secondary)' }}>+{edge} weighted</div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* AI Analysis */}
          <div className="card">
            <div className="card-title">AI Matchup Analysis</div>
            {aiText
              ? <div style={{ fontSize: 13, lineHeight: 1.7, borderLeft: '3px solid var(--green)', paddingLeft: '0.85rem' }}>{aiText}</div>
              : <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}><span className="spinner" />Generating analysis...</div>
            }
          </div>
        </>
      )}
    </div>
  )
}
