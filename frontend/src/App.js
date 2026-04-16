import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import Matchup from './components/Matchup';
import BestBets from './components/BestBets';
import { getCourses, getPlayers } from './api';
import './App.css';

export default function App() {
  const [tab, setTab] = useState('dashboard');
  const [courses, setCourses] = useState([]);
  const [players, setPlayers] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('masters');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getCourses(), getPlayers()])
      .then(([c, p]) => { setCourses(c); setPlayers(p); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="loading-screen">
      <div className="spinner" />
      <p>Loading FairwayIQ...</p>
    </div>
  );

  return (
    <div className="app">
      <header className="topbar">
        <div className="logo">Fairway<span className="logo-accent">IQ</span>
          <span className="logo-sub">PGA Analytics</span>
        </div>
        <nav className="tabs">
          {[['dashboard','Dashboard'],['matchup','Matchup'],['bets','Best Bets']].map(([id, label]) => (
            <button key={id} className={`tab ${tab === id ? 'active' : ''}`} onClick={() => setTab(id)}>
              {label}
            </button>
          ))}
        </nav>
        <div className="course-selector">
          <select value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)}>
            {courses.map(c => (
              <option key={c.id} value={c.id}>{c.tournament}</option>
            ))}
          </select>
        </div>
      </header>

      <main className="main-content">
        {tab === 'dashboard' && <Dashboard courseId={selectedCourse} courses={courses} />}
        {tab === 'matchup'   && <Matchup courseId={selectedCourse} players={players} courses={courses} />}
        {tab === 'bets'      && <BestBets courseId={selectedCourse} />}
      </main>
    </div>
  );
}
