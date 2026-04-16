import { useState, useEffect } from 'react'
import { api, getAIAnalysis } from '../api.js'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts'

const PLAYERS = [
  { id: 0, name: 'Scottie Scheffler' },
  { id: 1, name: 'Rory McIlroy' },
  { id: 2, name: 'Jon Rahm' },
  { id: 3, name: 'Xander Schauffele' },
  { id: 4, name: 'Viktor Hovland' },
  { id: 5, name: 'Collin Morikawa' },
  { id: 6, name: 'Patrick Cantlay' },
  { id: 7, name: 'Ludvig Åberg' },
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
      if (data.player_a && data.player_b) {
        const pa = data.player_a, pb = data.player_b
        getAIAnalysis(
          `Golf matchup at ${data.course_id || courseId}: ${pa.name} (SG Total +${pa.sg_total}, SG App +${pa.sg_app}, win prob ${data.win_probability_a}%) vs ${pb.name} (SG Total +${pb.sg_total}, SG App +${pb.sg_app}, win prob ${data.win_probability_b}%). Explain who wins and why in 3-4 sentences.`
        ).then(setAiText)
      }
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const radarData = result?.player_a ? [
    { cat: 'OTT',   A: result.player_a.sg_ott,   B: result.player_b.sg_ott },
    { cat: 'APP',   A: result.player_a.sg_app,   B: result.player_b.sg_app },
    { cat: 'ARG',   A: result.player_a.sg_arg,   B: result.player_b.sg_arg },
    { cat: 'PUTT',  A: result.player_a.sg_putt,  B: result.player_b.sg_putt },
    { cat: 'Total', A: result.player_a.sg_total, B: result.player_b.sg_total },
  ] : []

  const pa = result?.player_a
  const pb = result?.player_b
  const probA = result?.win_probability_a ?? 50
  const probB = result?.win_probability_b ?? 50
  const modelPick = result?.model_pick

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

      {!loading && pa && pb && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            {[{p: pa, prob: probA, color: 'var(--green)', bg: 'var(--green-light)', i: 0},
              {p: pb, prob: probB, color: 'var(--gold)',  bg: 'var(--gold-light)',  i: 1}].map(({p, prob, color, bg}) => (
              <div key={p.name} className="card" style={{ borderColor: p.name === modelPick ? color : 'var(--border)', borderWidth: p.name === modelPick ? 2 : 0.5 }}>
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
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Fit Score: <span style={{ fontFamily: 'var(--ff-mono)', color: 'var(--text)' }}>{p.fit_score}</span></div>
                {p.name === modelPick && (
                  <div style={{ marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 500, padding: '3px 10px', borderRadius: 20, background: color, color: 'white' }}>Model Pick</div>
                )}
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div className="card">
              <div className="card-title">SG Category Breakdown</div>
              {result.sg_breakdown?.map(cat => (
                <SGBar key={cat.category}
                  label={cat.category}
                  valA={cat.player_a_val} valB={cat.player_b_val}
                  nameA={pa.name} nameB={pb.name}
                  weight={cat.course_weight || 0.25}
                />
              ))}
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