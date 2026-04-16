import { useState, useEffect } from 'react'
import { api } from '../api.js'
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'

export default function Backtest({ courseId }) {
  const [data, setData]         = useState(null)
  const [optimized, setOptimized] = useState(null)
  const [loading, setLoading]   = useState(true)
  const [optimizing, setOptimizing] = useState(false)

  useEffect(() => {
    setLoading(true)
    setOptimized(null)
    api.runBacktest(courseId)
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [courseId])

  async function runOptimize() {
    setOptimizing(true)
    const result = await api.optimizeWeights(courseId).catch(() => null)
    setOptimized(result)
    setOptimizing(false)
  }

  const scatterData = data?.results?.map(r => ({
    x: r.fit_score,
    y: r.actual_finish,
    name: r.player,
    season: r.season,
    predicted: r.predicted_rank,
  })) || []

  return (
    <div>
      <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
        Backtest validates model accuracy using historical finish data. Optimize weights to improve predictions.
      </div>

      {loading && <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}><span className="spinner" />Running backtest...</div>}

      {!loading && data && !data.error && (
        <>
          {/* Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 10, marginBottom: '1.25rem' }}>
            {[
              { label: 'Mean Abs. Error', value: data.metrics.mean_absolute_error, sub: 'positions off' },
              { label: 'Top 5 Accuracy', value: `${data.metrics.top5_accuracy_pct}%`, sub: 'correct bucket', color: 'var(--green)' },
              { label: 'Top 10 Accuracy', value: `${data.metrics.top10_accuracy_pct}%`, sub: 'correct bucket', color: 'var(--green)' },
              { label: 'SG Correlation', value: data.metrics.fit_score_correlation, sub: 'negative = good' },
            ].map(m => (
              <div key={m.label} style={{ background: '#f4f6f8', borderRadius: 8, padding: '0.85rem 1rem' }}>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 6 }}>{m.label}</div>
                <div style={{ fontSize: 22, fontWeight: 500, fontFamily: 'var(--ff-mono)', color: m.color || 'var(--text)' }}>{m.value}</div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{m.sub}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            {/* Scatter: fit score vs actual finish */}
            <div className="card">
              <div className="card-title">Fit Score vs Actual Finish</div>
              <ResponsiveContainer width="100%" height={220}>
                <ScatterChart margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" />
                  <XAxis dataKey="x" name="Fit Score" tick={{ fontSize: 11 }} label={{ value: 'Fit Score', position: 'insideBottom', offset: -2, fontSize: 11 }} />
                  <YAxis dataKey="y" name="Actual Finish" tick={{ fontSize: 11 }} reversed label={{ value: 'Finish', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    const d = payload[0].payload
                    return <div style={{ background: 'white', border: '0.5px solid #e2e8f0', borderRadius: 6, padding: '6px 10px', fontSize: 11 }}>
                      <div style={{ fontWeight: 500 }}>{d.name}</div>
                      <div>Fit: {d.x} | Finish: T{d.y} | {d.season}</div>
                    </div>
                  }} />
                  <Scatter data={scatterData} fill="#1a7a4a" opacity={0.75} />
                </ScatterChart>
              </ResponsiveContainer>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 8 }}>
                Ideal: high fit scores (right) = low finish numbers (top). Correlation: {data.metrics.fit_score_correlation}
              </div>
            </div>

            {/* Results table */}
            <div className="card">
              <div className="card-title">Historical Predictions</div>
              <div style={{ overflowY: 'auto', maxHeight: 240 }}>
                <table className="table" style={{ fontSize: 12 }}>
                  <thead>
                    <tr>
                      <th>Season</th>
                      <th>Player</th>
                      <th>Predicted</th>
                      <th>Actual</th>
                      <th>Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.results.map((r, i) => (
                      <tr key={i}>
                        <td>{r.season}</td>
                        <td style={{ fontWeight: 500 }}>{r.player.split(' ').pop()}</td>
                        <td style={{ fontFamily: 'var(--ff-mono)' }}>T{r.predicted_rank}</td>
                        <td style={{ fontFamily: 'var(--ff-mono)' }}>T{r.actual_finish}</td>
                        <td>
                          <span style={{
                            fontFamily: 'var(--ff-mono)', fontSize: 11,
                            color: r.rank_error <= 3 ? 'var(--green)' : r.rank_error <= 7 ? 'var(--gold)' : '#c0392b'
                          }}>±{r.rank_error}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Weight optimizer */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <div className="card-title" style={{ margin: 0 }}>Weight Optimizer</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                  Grid-search over SG weight combinations to minimize Mean Absolute Error
                </div>
              </div>
              <button className="btn btn-green" onClick={runOptimize} disabled={optimizing}>
                {optimizing ? <><span className="spinner" />Optimizing...</> : 'Run Optimizer'}
              </button>
            </div>

            {/* Current vs optimized weights */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 500 }}>Current Weights</div>
                {Object.entries(data.weight_optimization_hint.current_weights).map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <div style={{ width: 100, fontSize: 12, color: 'var(--text-secondary)' }}>{k.replace('sg_','SG ').toUpperCase()}</div>
                    <div style={{ flex: 1, height: 6, background: '#f0f4f8', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${v * 300}%`, background: '#cbd5e0', borderRadius: 3 }} />
                    </div>
                    <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, width: 30, textAlign: 'right' }}>{Math.round(v * 100)}%</div>
                  </div>
                ))}
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 500 }}>
                  {optimized ? `Optimized Weights (MAE: ${optimized.optimized_mae})` : 'Optimized Weights'}
                </div>
                {optimizing && <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}><span className="spinner" />Running grid search ({'>'}100 trials)...</div>}
                {optimized && Object.entries(optimized.optimized_weights).map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <div style={{ width: 100, fontSize: 12, color: 'var(--text-secondary)' }}>{k.replace('sg_','SG ').toUpperCase()}</div>
                    <div style={{ flex: 1, height: 6, background: '#f0f4f8', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${v * 300}%`, background: 'var(--green)', borderRadius: 3 }} />
                    </div>
                    <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, width: 30, textAlign: 'right' }}>{Math.round(v * 100)}%</div>
                  </div>
                ))}
                {!optimized && !optimizing && (
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', padding: '1rem 0' }}>Click "Run Optimizer" to find best weights for this course.</div>
                )}
              </div>
            </div>

            {optimized && (
              <div style={{ marginTop: '1rem', background: '#e8f5ee', borderRadius: 8, padding: '0.75rem 1rem', fontSize: 12, color: 'var(--green)' }}>
                <strong>Recommendation:</strong> {optimized.recommendation}
              </div>
            )}
          </div>
        </>
      )}

      {!loading && data?.error && (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13 }}>
          {data.error} — historical data not yet available for this course.
        </div>
      )}
    </div>
  )
}
