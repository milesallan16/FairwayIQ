# FairwayIQ — PGA Tour Analytics Dashboard

A full-stack golf analytics app that predicts player performance using Strokes Gained data,
course-fit modeling, matchup predictions, and AI-powered insights.

---

## Project Structure

```
fairwayiq/
├── backend/          # Python FastAPI backend
│   ├── main.py
│   ├── routers/
│   │   ├── players.py      # Player SG stats + DataGolf integration
│   │   ├── courses.py      # Course data + SG weights
│   │   ├── matchup.py      # Matchup engine + leaderboard projections
│   │   ├── bets.py         # Best bets / model edge finder
│   │   └── backtest.py     # Historical backtesting + weight optimizer
│   ├── requirements.txt
│   └── .env.example
│
└── frontend/         # React + Vite frontend
    ├── src/
    │   ├── App.jsx
    │   ├── api.js            # API service layer
    │   └── views/
    │       ├── Dashboard.jsx   # Leaderboard + course weights
    │       ├── Matchup.jsx     # Head-to-head predictor
    │       ├── BestBets.jsx    # Model vs Vegas edges
    │       └── Backtest.jsx    # Backtesting + optimizer
    ├── package.json
    ├── vite.config.js
    └── .env.example
```

---

## Quick Start (Local)

### 1. Backend

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env   # Add your API keys
uvicorn main:app --reload --port 8000
```

API docs available at: http://localhost:8000/docs

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env   # Add your Anthropic API key
npm run dev
```

Open http://localhost:5173

---

## API Keys Needed

### Anthropic API (for AI insights)
1. Go to https://console.anthropic.com
2. Create an API key
3. Add to `frontend/.env` as `VITE_ANTHROPIC_API_KEY`

### DataGolf API (for live SG data — optional)
1. Go to https://datagolf.com/api-access
2. Subscribe to a plan (free tier available)
3. Add to `backend/.env` as `DATAGOLF_API_KEY`
4. Call `/api/players/?use_live=true` to fetch live data

---

## Deploy to the Web (Share with Friends)

### Backend → Railway

1. Go to https://railway.app and create a free account
2. New Project → Deploy from GitHub repo (or drag the `backend/` folder)
3. Set environment variables in Railway dashboard:
   - `DATAGOLF_API_KEY` (optional)
4. Railway gives you a URL like: `https://fairwayiq-backend.railway.app`
5. Copy that URL into `frontend/vercel.json` → replace `YOUR-RAILWAY-URL`

### Frontend → Vercel

1. Go to https://vercel.com and create a free account
2. New Project → Import GitHub repo (or drag the `frontend/` folder)
3. Set environment variables in Vercel dashboard:
   - `VITE_ANTHROPIC_API_KEY` = your Anthropic key
   - `VITE_API_URL` = `https://your-railway-url.railway.app/api`
4. Deploy — Vercel gives you a shareable URL instantly

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/players/` | All player SG stats |
| GET | `/api/players/?use_live=true` | Live data from DataGolf |
| GET | `/api/courses/` | All courses + weights |
| GET | `/api/courses/{id}` | Single course detail |
| GET | `/api/matchup/leaderboard?course_id=masters` | Full projected leaderboard |
| GET | `/api/matchup/?player_a_id=1&player_b_id=2&course_id=masters` | Head-to-head |
| GET | `/api/bets/?course_id=masters` | Best bets vs Vegas |
| GET | `/api/backtest/?course_id=masters` | Backtest results |
| GET | `/api/backtest/optimize?course_id=masters` | Optimize SG weights |

Full interactive docs: `http://localhost:8000/docs`

---

## Model Logic

### Course Fit Score
```
fit_score = (w_ott × sg_ott) + (w_app × sg_app) + (w_arg × sg_arg) + (w_putt × sg_putt)
normalized to 0–100 scale
```

### Win Probability (Matchup)
```
adj_score = fit_score × 0.8 + fit_score × form_multiplier × 0.2
win_prob_A = adj_score_A / (adj_score_A + adj_score_B) × 100
```

### Course Weights (Example)
| Course | OTT | APP | ARG | PUTT |
|--------|-----|-----|-----|------|
| Augusta | 20% | 35% | 28% | 17% |
| TPC Sawgrass | 28% | 30% | 18% | 24% |
| Torrey Pines | 35% | 32% | 15% | 18% |

### Weight Optimizer
Runs a grid search over ~100+ weight combinations, minimizing Mean Absolute Error
against historical finish data. Update `COURSES_DB` in `routers/courses.py` with
optimized weights to improve model accuracy.

---

## Roadmap / Enhancements

- [ ] Connect DataGolf API for live 2025 season SG data
- [ ] Add weather adjustment (wind impact on SG: OTT)
- [ ] Integrate live odds API (The Odds API)
- [ ] Add more courses + historical results for backtesting
- [ ] XGBoost/regression model replacing weighted scoring
- [ ] User accounts + saved picks
- [ ] Mobile app (React Native)
