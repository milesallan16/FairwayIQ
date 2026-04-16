import { useState } from 'react'
import Dashboard from './views/Dashboard.jsx'
import Matchup from './views/Matchup.jsx'
import BestBets from './views/BestBets.jsx'
import Backtest from './views/Backtest.jsx'

const TABS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'matchup',   label: 'Matchup' },
  { id: 'bets',      label: 'Best Bets' },
  { id: 'backtest',  label: 'Backtest' },
]

const COURSES = [
  { id: 'rbc', label: 'RBC Heritage — Harbour Town' },
]

export default function App() {
  const [tab, setTab] = useState('dashboard')
  const [courseId, setCourseId] = useState('rbc')

  return (
    <div style={{ minHeight: '100vh', background: '#f4f6f8' }}>
      {/* Top bar */}
      <header style={{
        background: 'white', borderBottom: '0.5px solid #e2e8f0',
        padding: '0 2rem', position: 'sticky', top: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ fontFamily: 'var(--ff-display)', fontSize: 22, color: 'var(--green)', letterSpacing: -0.5 }}>
            Fairway<span style={{ color: 'var(--gold)' }}>IQ</span>
          </div>
          <nav style={{ display: 'flex', gap: 2, background: '#f4f6f8', borderRadius: 8, padding: 3 }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                padding: '5px 14px', borderRadius: 6, fontSize: 13, fontWeight: 500,
                cursor: 'pointer', border: 'none', fontFamily: 'var(--ff-body)',
                background: tab === t.id ? 'white' : 'transparent',
                color: tab === t.id ? 'var(--green)' : 'var(--text-secondary)',
                boxShadow: tab === t.id ? '0 1px 3px rgba(0,0,0,.1)' : 'none',
                transition: 'all .15s'
              }}>{t.label}</button>
            ))}
          </nav>
        </div>

        {/* Global tournament selector */}
        <div style={{ position: 'relative', width: 260 }}>
          <select value={courseId} onChange={e => setCourseId(e.target.value)}>
            {COURSES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
          <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: 'var(--muted)', pointerEvents: 'none' }}>▾</span>
        </div>
      </header>

      {/* Main content */}
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '1.5rem 1.5rem 4rem' }}>
        {tab === 'dashboard' && <Dashboard courseId={courseId} />}
        {tab === 'matchup'   && <Matchup   courseId={courseId} />}
        {tab === 'bets'      && <BestBets  courseId={courseId} />}
        {tab === 'backtest'  && <Backtest  courseId={courseId} />}
      </main>
    </div>
  )
}
