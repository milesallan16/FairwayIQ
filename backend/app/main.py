from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import players, courses, predictions, matchup, bets

app = FastAPI(title="FairwayIQ API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(players.router, prefix="/api/players", tags=["players"])
app.include_router(courses.router, prefix="/api/courses", tags=["courses"])
app.include_router(predictions.router, prefix="/api/predictions", tags=["predictions"])
app.include_router(matchup.router, prefix="/api/matchup", tags=["matchup"])
app.include_router(bets.router, prefix="/api/bets", tags=["bets"])

@app.get("/")
def root():
    return {"status": "ok", "service": "FairwayIQ API"}

@app.get("/health")
def health():
    return {"status": "healthy"}
