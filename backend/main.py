from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import players, courses, matchup, bets, backtest

app = FastAPI(title="FairwayIQ API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(players.router, prefix="/api/players", tags=["players"])
app.include_router(courses.router, prefix="/api/courses", tags=["courses"])
app.include_router(matchup.router, prefix="/api/matchup", tags=["matchup"])
app.include_router(bets.router, prefix="/api/bets", tags=["bets"])
app.include_router(backtest.router, prefix="/api/backtest", tags=["backtest"])

@app.get("/")
def root():
    return {"status": "FairwayIQ API running", "version": "1.0.0"}
