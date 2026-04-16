import { useState, useEffect } from 'react'
import { api, getAIAnalysis } from '../api.js'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const TIER_BADGE = {
  'Top 5':    'badge badge-green',
  'Top 10':   'badge badge-gold',
  'Top 20':   'badge badge-gray',
  'Cut Risk': 'badge badge-red',
}

function WeightBar({ label, pct, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
      <div style={{ width: 140, fontSize: 12, color: 'var(--text-secondary)', flexShrink: 0 }}>{label}</div>
      <div style={{ flex: 1, height: 8, background: '#f0f4f8', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct * 300}%`, background: color, borderRadius: 4 }} />
      </div>
      <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--text-secondary)', width: 30, textAlign: 'right' }}>{Math.round(pct * 100)}%</div>
    </div>
  )
}

function MetricCard({ label, value, sub, subColor }) {
  return (
    <div style={{ background: '#f4f6f8', borderRadius: 8, padding: '0.85rem 1rem' }}>
      <div style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 500, fontFamily: 'var(--ff-mono)' }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: subColor || 'var(--text-secondary)', marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

export default function Dashboard({ courseId }) {
  const [field, setField]     = useState([])
  const [course, setCourse]   = useState(null)
  const [aiText, setAiText]   = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    setAiText('')
    api.getLeaderboard(courseId)
      .then(data => {
        const c = data.course
        const f = data.field || []
        setCourse(c)
        setField(f)
        setLoading(false)
        getAIAnalysis(
          `Analyze ${c.name} for PGA Tour performance prediction. Key metric: ${c.key_metric}. Green type: ${c.green_type}. Yardage: ${c.yardage}. Course weights: Approach ${Math.round(c.weight_app*100)}%, OTT ${Math.round(c.weight_ott*100)}%, Around Green ${Math.round(c.weight_arg*100)}%, Putting ${Math.round(c.weight_putt*100)}%. What player profile wins here and why?`
        ).then(setAiText)
      })
      .catch(e => { console.error(e); setLoading(false) })
  }, [courseId])

  const top = field[0]
  const fieldAvg = field.length
    ? +(field.reduce((s, p) => s + p.sg_total, 0) / field.length).toFixed(2)
    : 0

  const chartData = field.slice(0, 6).map(p => ({
    name: p.player_name.split(' ').pop(),
    OTT:  +p.sg_ott.toFixed(2),
    APP:  +p.sg_app.toFixed(2),
    ARG:  +p.sg_arg.toFixed(2),
    PUTT: +p.sg_putt.toFixed(2),
  }))

  return (
    <div>
      {loading && (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <span className="spinner" />Loading predictions...
        </div>
      )}

      {!loading && course && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 10, marginBottom: '1.25rem' }}>
            <MetricCard label="Top Fit Score" value={top?.fit_score ?? '—'} sub={top?.player_name} />
            <MetricCard label="Field SG Avg"  value={`+${fieldAvg}`} sub="vs Tour average" subColor="var(--green)" />
            <MetricCard label="Key Metric"    value={course.key_metric} sub="Highest course weight" />
            <MetricCard label="Green Type"    value={course.green_type} sub={`${course.yardage?.toLocaleString()} yds`} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div className="card">
              <div className="card-title">Course Fit Weighting</div>
              <WeightBar label="Off-the-Tee"  pct={course.weight_ott}  color="#1a7a4a" />
              <WeightBar label="Approach"      pct={course.weight_app}  color="#2da65e" />
              <WeightBar label="Around Green"  pct={course.weight_arg}  color="#b8860b" />
              <WeightBar label="Putting"       pct={course.weight_putt} color="#d4a017" />
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: '0.75rem', lineHeight: 1.5 }}>{course.description}</div>
            </div>

            <div className="card">
              <div className="card-title">SG Breakdown — Top 6 Players</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Bar dataKey="OTT"  stackId="a" fill="#1a7a4a" />
                  <Bar dataKey="APP"  stackId="a" fill="#2da65e" />
                  <Bar dataKey="ARG"  stackId="a" fill="#b8860b" />
                  <Bar dataKey="PUTT" stackId="a" fill="#d4a017" radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
                {[['OTT','#1a7a4a'],['APP','#2da65e'],['ARG','#b8860b'],['PUTT','#d4a017']].map(([l,c]) => (
                  <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-secondary)' }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: c, display: 'inline-block' }} />{l}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div className="card-title" style={{ margin: 0 }}>Predicted Leaderboard</div>
              <span className="badge badge-green">Model Projection</span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: 36 }}>Pos</th>
                    <th>Player</th>
                    <th>Fit Score</th>
                    <th>Proj. SG</th>
                    <th>OTT</th>
                    <th>APP</th>
                    <th>ARG</th>
                    <th>PUTT</th>
                    <th>Top 5%</th>
                    <th>Tier</th>
                  </tr>
                </thead>
                <tbody>
                  {field.map((p, i) => (
                    <tr key={p.player_id}>
                      <td style={{ fontFamily: 'var(--ff-mono)', fontWeight: 500 }}>{i + 1}</td>
                      <td>
                        <div style={{ fontWeight: 500, fontSize: 13 }}>{p.player_name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>World #{p.world_rank}</div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 60, height: 5, background: '#f0f4f8', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${Math.min(p.fit_score * 3, 100)}%`, background: 'var(--green)', borderRadius: 3 }} />
                          </div>
                          <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 12 }}>{p.fit_score}</span>
                        </div>
                      </td>
                      <td style={{ fontFamily: 'var(--ff-mono)', fontSize: 13, color: 'var(--green)' }}>+{p.projected_sg}</td>
                      <td style={{ fontFamily: 'var(--ff-mono)', fontSize: 12 }}>{p.sg_ott.toFixed(2)}</td>
                      <td style={{ fontFamily: 'var(--ff-mono)', fontSize: 12 }}>{p.sg_app.toFixed(2)}</td>
                      <td style={{ fontFamily: 'var(--ff-mono)', fontSize: 12 }}>{p.sg_arg.toFixed(2)}</td>
                      <td style={{ fontFamily: 'var(--ff-mono)', fontSize: 12 }}>{p.sg_putt.toFixed(2)}</td>
                      <td style={{ fontFamily: 'var(--ff-mono)', fontSize: 12, color: 'var(--green)' }}>{Math.round(p.prob_top5 * 100)}%</td>
                      <td><span className={TIER_BADGE[p.tier] || 'badge badge-gray'}>{p.tier}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card">
            <div className="card-title">AI Course Analysis</div>
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