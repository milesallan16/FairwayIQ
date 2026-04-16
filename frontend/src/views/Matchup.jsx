import { useState, useEffect } from 'react'
import { api, getAIAnalysis } from '../api.js'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts'

const PLAYERS = [
  { id: 0, name: 'Scottie Scheffler', world_rank: 1, sg_ott: 0.82, sg_app: 1.34, sg_arg: 0.41, sg_putt: 0.18, sg_total: 2.75 },
  { id: 1, name: 'Rory McIlroy',      world_rank: 2, sg_ott: 1.21, sg_app: 0.98, sg_arg: 0.22, sg_putt: 0.31, sg_total: 2.72 },
  { id: 2, name: 'Jon Rahm',          world_rank: 3, sg_ott: 0.54, sg_app: 1.18, sg_arg: 0.55, sg_putt: 0.28, sg_total: 2.55 },
  { id: 3, name: 'Xander Schauffele', world_rank: 4, sg_ott: 0.71, sg_app: 1.02, sg_arg: 0.38, sg_putt: 0.44, sg_total: 2.55 },
  { id: 4, name: 'Viktor Hovland',    world_rank: 5, sg_ott: 0.88, sg_app: 0.84, sg_arg: 0.18, sg_putt: 0.12, sg_total: 2.02 },
  { id: 5, name: 'Collin Morikawa',   world_rank: 6, sg_ott: 0.22, sg_app: 1.28, sg_arg: 0.31, sg_putt: 0.08, sg_total: 1.89 },
  { id: 6, name: 'Patrick Cantlay',   world_rank: 7, sg_ott: 0.38, sg_app: 0.88, sg_arg: 0.52, sg_putt: 0.58, sg_total: 2.36 },
  { id: 7, name: 'Ludvig Åberg',      world_rank: 8, sg_ott: 0.65, sg_app: 0.92, sg_arg: 0.28, sg_putt: 0.22, sg_total: 2.07 },
]

export default function Matchup({ courseId }) {
  const [playerA, setPlayerA] = useState(0)
  const [playerB, setPlayerB] = useState(1)
  const [result, setResult]   = useState(null)
  const [aiText, setAiText]   = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => { runMatchup() }, [playerA, playerB, courseId])

  async function runMatchup() {
    if (playerA === playerB) return
    setLoading(true)
    setAiText('')
    try {
      const data = await api.getMatchup(playerA, playerB, courseId)
      setResult(data)
      getAIAnalysis(
        `Golf matchup at ${data.course}: ${data.player_a} (win prob ${Math.round(data.prob_a*100)}%, fit ${data.fit_a}) vs ${data.player_b} (win prob ${Math.round(data.prob_b*100)}%, fit ${data.fit_b}). Model pick: ${data.model_pick}. Key edge: ${data.key_edges?.[0]?.category} (+${data.key_edges?.[0]?.weighted_edge?.toFixed(3)}). Explain who wins and why in 3 sentences.`
      ).then(setAiText)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const pa = PLAYERS.find(p => p.id === playerA)
  const pb = PLAYERS.find(p => p.id === playerB)

  const radarData = pa && pb ? [
    { cat: 'OTT',   A: pa.sg_ott,   B: pb.sg_ott },
    { cat: 'APP',   A: pa.sg_app,   B: pb.sg_app },
    { cat: 'ARG',   A: pa.sg_arg,   B: pb.sg_arg },
    { cat: 'PUTT',  A: pa.sg_putt,  B: pb.sg_putt },
    { cat: 'Total', A: pa.sg_total, B: pb.sg_total },
  ] : []

  const probA = result ? Math.round(result.prob_a * 100) : 50
  const probB = result ? Math.round(result.prob_b * 100) : 50

  return (
    <div>
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

      {!loading && result && pa && pb && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            {[{p: pa, prob: probA, color: 'var(--green)', bg: 'var(--green-light)', fit: result.fit_a},
              {p: pb, prob: probB, color: 'var(--gold)',  bg: 'var(--gold-light)',  fit: result.fit_b}].map(({p, prob, color, bg, fit}) => (
              <div key={p.name} className="card" style={{ borderColor: p.name === result.model_pick ? color : 'var(--border)', borderWidth: p.name === result.model_pick ? 2 : 0.5 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 500, fontSize: 13, color }}>
                    {p.name.split(' ').map(w => w[0]).join('').slice(0,2)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 500 }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>World #{p.world_rank}</div>
                  </div>
                </div>
                <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 32, fontWeight: 500, color }}>{prob}%</div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 8 }}>win probability</div>
                <div style={{ height: 6, background: '#f0f4f8', borderRadius: 3, overflow: 'hidden', marginBottom: 8 }}>
                  <div style={{ height: '100%', width: `${prob}%`, background: color, borderRadius: 3 }} />
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Fit Score: <span style={{ fontFamily: 'var(--ff-mono)', color: 'var(--text)' }}>{fit}</span></div>
                {p.name === result.model_pick && (
                  <div style={{ marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 500, padding: '3px 10px', borderRadius: 20, background: color, color: 'white' }}>Model Pick</div>
                )}
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div className="card">
              <div className="card-title">SG Category Breakdown</div>
              {result.key_edges?.map(cat => {
                const max = 1.5
                const wA = Math.round(Math.max(cat.a, 0) / max * 100)
                const wB = Math.round(Math.max(cat.b, 0) / max * 100)
                const edge = cat.edge
                return (
                  <div key={cat.category} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>
                      <span>{cat.category} <span style={{ opacity: .6 }}>({Math.round(cat.weight * 100)}%)</span></span>
                      <span style={{ color: edge >= 0 ? 'var(--green)' : 'var(--gold)', fontFamily: 'var(--ff-mono)' }}>
                        {cat.advantage.split(' ').pop()} +{Math.abs(edge).toFixed(2)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--green)', width: 34, textAlign: 'right' }}>{cat.a.toFixed(2)}</span>
                      <div style={{ flex: 1, display: 'flex', gap: 2, alignItems: 'center' }}>
                        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
                          <div style={{ width: `${wA}%`, height: 8, background: 'var(--green)', borderRadius: 4 }} />
                        </div>
                        <div style={{ width: 1, height: 16, background: 'var(--border)' }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ width: `${wB}%`, height: 8, background: 'var(--gold)', borderRadius: 4 }} />
                        </div>
                      </div>
                      <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--gold)', width: 34 }}>{cat.b.toFixed(2)}</span>
                    </div>
                  </div>
                )
              })}
              <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: 11 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--green)', display: 'inline-block' }} />{pa.name.split(' ').pop()}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--gold)', display: 'inline-block' }} />{pb.name.split(' ').pop()}</span>
              </div>
            </div>

            <div className="card">
              <div className="card-title">Radar Comparison</div>
              <ResponsiveContainer width="100%" height={200}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="cat" tick={{ fontSize: 11 }} />
                  <Radar name={pa.name.split(' ').pop()} dataKey="A" stroke="#1a7a4a" fill="#1a7a4a" fillOpacity={0.25} />
                  <Radar name={pb.name.split(' ').pop()} dataKey="B" stroke="#b8860b" fill="#b8860b" fillOpacity={0.20} />
                  <Tooltip contentStyle={{ fontSize: 11 }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

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