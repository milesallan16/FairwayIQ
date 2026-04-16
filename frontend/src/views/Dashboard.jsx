import { useState, useEffect } from 'react'
import { api, getAIAnalysis } from '../api.js'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const TIER_BADGE = {
  'Top 5':    'badge badge-green',
  'Top 10':   'badge badge-gold',
  'Top 20':   'badge badge-gray',
  'Cut Risk': 'badge badge-red',
}

const SG_COLORS = { sg_ott: '#1a7a4a', sg_app: '#2da65e', sg_arg: '#b8860b', sg_putt: '#d4a017' }

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
  const [leaderboard, setLeaderboard] = useState([])
  const [course, setCourse] = useState(null)
  const [aiText, setAiText] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    setAiText('')
    Promise.all([api.getLeaderboard(courseId), api.getCourse(courseId)])
      .then(([lb, c]) => {
        setLeaderboard(lb.leaderboard || [])
        setCourse(c)
        setLoading(false)
        getAIAnalysis(
          `Analyze ${c.name} (${c.venue}). SG weights: Approach ${Math.round(c.sg_weights.sg_app*100)}%, OTT ${Math.round(c.sg_weights.sg_ott*100)}%, Around Green ${Math.round(c.sg_weights.sg_arg*100)}%, Putting ${Math.round(c.sg_weights.sg_putt*100)}%. Green type: ${c.green_type}. What player profile wins here and what SG category is most decisive?`
        ).then(setAiText)
      })
      .catch(() => setLoading(false))
  }, [courseId])

  const chartData = leaderboard.slice(0, 6).map(p => ({
    name: p.name.split(' ').pop(),
    OTT:  +p.sg_stats.sg_ott.toFixed(2),
    APP:  +p.sg_stats.sg_app.toFixed(2),
    ARG:  +p.sg_stats.sg_arg.toFixed(2),
    PUTT: +p.sg_stats.sg_putt.toFixed(2),
  }))

  const top = leaderboard[0]
  const fieldAvg = leaderboard.length
    ? +(leaderboard.reduce((s, p) => s + p.sg_stats.sg_total, 0) / leaderboard.length).toFixed(2)
    : 0

  return (
    <div>
      {loading && <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}><span className="spinner" />Loading predictions...</div>}

      {!loading && course && (
        <>
          {/* Metric row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 10, marginBottom: '1.25rem' }}>
            <MetricCard label="Top Fit Score" value={top?.fit_score ?? '—'} sub={top?.name} />
            <MetricCard label="Field SG Avg" value={`+${fieldAvg}`} sub="vs Tour average" subColor="var(--green)" />
            <MetricCard label="Key Metric" value={course.key_metric} sub="Highest course weight" />
            <MetricCard label="Green Type" value={course.green_type} sub={`${course.yardage?.toLocaleString()} yds`} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            {/* Weights card */}
            <div className="card">
              <div className="card-title">Course Fit Weighting</div>
              <WeightBar label="Off-the-Tee"   pct={course.sg_weights.sg_ott}  color="#1a7a4a" />
              <WeightBar label="Approach"       pct={course.sg_weights.sg_app}  color="#2da65e" />
              <WeightBar label="Around Green"   pct={course.sg_weights.sg_arg}  color="#b8860b" />
              <WeightBar label="Putting"        pct={course.sg_weights.sg_putt} color="#d4a017" />
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: '0.75rem', lineHeight: 1.5 }}>{course.course_note}</div>
            </div>

            {/* SG chart */}
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

          {/* Leaderboard */}
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
                    <th>Tier</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((p, i) => (
                    <tr key={p.player_id}>
                      <td style={{ fontFamily: 'var(--ff-mono)', fontWeight: 500 }}>{i + 1}</td>
                      <td>
                        <div style={{ fontWeight: 500, fontSize: 13 }}>{p.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>World #{p.world_rank}</div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 60, height: 5, background: '#f0f4f8', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${p.fit_score}%`, background: 'var(--green)', borderRadius: 3 }} />
                          </div>
                          <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 12 }}>{p.fit_score}</span>
                        </div>
                      </td>
                      <td style={{ fontFamily: 'var(--ff-mono)', fontSize: 13, color: 'var(--green)' }}>+{p.projected_sg_total}</td>
                      <td style={{ fontFamily: 'var(--ff-mono)', fontSize: 12 }}>{p.sg_stats.sg_ott.toFixed(2)}</td>
                      <td style={{ fontFamily: 'var(--ff-mono)', fontSize: 12 }}>{p.sg_stats.sg_app.toFixed(2)}</td>
                      <td style={{ fontFamily: 'var(--ff-mono)', fontSize: 12 }}>{p.sg_stats.sg_arg.toFixed(2)}</td>
                      <td style={{ fontFamily: 'var(--ff-mono)', fontSize: 12 }}>{p.sg_stats.sg_putt.toFixed(2)}</td>
                      <td><span className={TIER_BADGE[p.tier] || 'badge badge-gray'}>{p.tier}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* AI Analysis */}
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
