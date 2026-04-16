import { useState, useEffect } from 'react'
import { api, getAIAnalysis } from '../api.js'

const CONF_COLOR = { High: 'badge-green', Medium: 'badge-gold', Low: 'badge-gray' }

export default function BestBets({ courseId }) {
  const [bets, setBets] = useState([])
  const [course, setCourse] = useState(null)
  const [aiText, setAiText] = useState('')
  const [loading, setLoading] = useState(true)
  const [minEdge, setMinEdge] = useState(0.08)

  useEffect(() => {
    setLoading(true)
    setAiText('')
    Promise.all([api.getBestBets(courseId), api.getCourse(courseId)])
      .then(([b, c]) => {
        setBets(b.bets || [])
        setCourse(c)
        setLoading(false)
        if (b.bets?.length) {
          const top3 = b.bets.slice(0, 3).map(x => `${x.player_name} ${x.bet_type} (model ${Math.round(x.model_probability*100)}% vs Vegas ${Math.round(x.vegas_implied*100)}%)`).join(', ')
          getAIAnalysis(`At ${c.name}, our model finds these edges vs Vegas: ${top3}. Course weights Approach at ${Math.round(c.sg_weights.sg_app*100)}%. Which bet has best risk-adjusted value and why might the market be mispricing these players?`).then(setAiText)
        }
      })
      .catch(() => setLoading(false))
  }, [courseId])

  const filtered = bets.filter(b => b.edge >= minEdge)

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          Model edges vs. Vegas — where our projection diverges from the market
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
          <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Min Edge</label>
          <select value={minEdge} onChange={e => setMinEdge(+e.target.value)} style={{ width: 100 }}>
            <option value={0.05}>5%+</option>
            <option value={0.08}>8%+</option>
            <option value={0.12}>12%+</option>
            <option value={0.20}>20%+</option>
          </select>
          <span style={{ position: 'relative', right: 28, top: 0, fontSize: 11, color: 'var(--muted)', pointerEvents: 'none' }}>▾</span>
        </div>
      </div>

      {loading && <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}><span className="spinner" />Scanning for edges...</div>}

      {!loading && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
            {filtered.length === 0 && (
              <div style={{ gridColumn: '1/-1', padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13 }}>
                No edges above {Math.round(minEdge * 100)}% threshold. Try lowering the filter.
              </div>
            )}
            {filtered.map((bet, i) => (
              <div key={i} className="card" style={{ borderTop: i < 3 ? '3px solid var(--green)' : '0.5px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                  <div style={{ fontWeight: 500, fontSize: 13 }}>{bet.player_name}</div>
                  <span className={`badge ${CONF_COLOR[bet.confidence]}`}>{bet.confidence}</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 10 }}>
                  World #{bet.world_rank} · {bet.bet_type}
                </div>

                {/* Edge visual */}
                <div style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>
                    <span>Model</span><span>Vegas Implied</span>
                  </div>
                  <div style={{ height: 6, background: '#f0f4f8', borderRadius: 3, overflow: 'hidden', position: 'relative' }}>
                    <div style={{ position: 'absolute', left: 0, height: '100%', width: `${bet.vegas_implied * 100}%`, background: '#e2e8f0', borderRadius: 3 }} />
                    <div style={{ position: 'absolute', left: 0, height: '100%', width: `${bet.model_probability * 100}%`, background: 'var(--green)', borderRadius: 3, opacity: 0.85 }} />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 16, fontWeight: 500, color: 'var(--green)' }}>{Math.round(bet.model_probability * 100)}%</div>
                    <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--text-secondary)' }}>{bet.model_odds} model</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 13, color: 'var(--text-secondary)' }}>{Math.round(bet.vegas_implied * 100)}%</div>
                    <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--text-secondary)' }}>{bet.vegas_odds} Vegas</div>
                  </div>
                  <div style={{ background: 'var(--green-light)', color: 'var(--green)', fontSize: 11, fontWeight: 500, padding: '3px 8px', borderRadius: 20 }}>
                    +{Math.round(bet.edge * 100)}% edge
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary stats */}
          {filtered.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: '1rem' }}>
              <div style={{ background: '#f4f6f8', borderRadius: 8, padding: '0.85rem 1rem' }}>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>Edges Found</div>
                <div style={{ fontSize: 22, fontWeight: 500, fontFamily: 'var(--ff-mono)' }}>{filtered.length}</div>
              </div>
              <div style={{ background: '#f4f6f8', borderRadius: 8, padding: '0.85rem 1rem' }}>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>Avg Edge</div>
                <div style={{ fontSize: 22, fontWeight: 500, fontFamily: 'var(--ff-mono)', color: 'var(--green)' }}>
                  +{Math.round(filtered.reduce((s, b) => s + b.edge, 0) / filtered.length * 100)}%
                </div>
              </div>
              <div style={{ background: '#f4f6f8', borderRadius: 8, padding: '0.85rem 1rem' }}>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>High Confidence</div>
                <div style={{ fontSize: 22, fontWeight: 500, fontFamily: 'var(--ff-mono)' }}>
                  {filtered.filter(b => b.confidence === 'High').length}
                </div>
              </div>
            </div>
          )}

          {/* AI */}
          <div className="card">
            <div className="card-title">AI Betting Analysis</div>
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
