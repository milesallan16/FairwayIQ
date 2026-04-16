from fastapi import APIRouter, Query
from routers.matchup import compute_fit_score, recent_form_multiplier
from routers.players import PLAYERS_DB
from routers.courses import COURSES_DB
import random

router = APIRouter()

# Simulated Vegas odds (implied probabilities) — replace with odds API
SIMULATED_ODDS = {
    1: {"top5": 0.40, "top10": 0.58, "top20": 0.72, "make_cut": 0.88},
    2: {"top5": 0.32, "top10": 0.50, "top20": 0.65, "make_cut": 0.85},
    3: {"top5": 0.28, "top10": 0.44, "top20": 0.60, "make_cut": 0.84},
    4: {"top5": 0.24, "top10": 0.40, "top20": 0.58, "make_cut": 0.82},
    5: {"top5": 0.18, "top10": 0.32, "top20": 0.50, "make_cut": 0.78},
    6: {"top5": 0.22, "top10": 0.36, "top20": 0.54, "make_cut": 0.80},
    7: {"top5": 0.16, "top10": 0.30, "top20": 0.48, "make_cut": 0.76},
    8: {"top5": 0.14, "top10": 0.26, "top20": 0.44, "make_cut": 0.74},
    9: {"top5": 0.12, "top10": 0.22, "top20": 0.40, "make_cut": 0.72},
    10:{"top5": 0.10, "top10": 0.20, "top20": 0.38, "make_cut": 0.70},
}

def model_probabilities(player: dict, course: dict, rank: int) -> dict:
    fit = compute_fit_score(player, course)
    form = recent_form_multiplier(player)
    adj = fit * 0.8 + fit * form * 0.2

    # Scale fit score to finish probabilities
    base = adj / 100
    return {
        "top5":  round(min(base * 0.80, 0.95), 2),
        "top10": round(min(base * 1.10, 0.95), 2),
        "top20": round(min(base * 1.35, 0.95), 2),
        "make_cut": round(min(base * 1.55, 0.97), 2),
    }

def prob_to_american_odds(p: float) -> str:
    if p <= 0 or p >= 1:
        return "N/A"
    if p >= 0.5:
        return f"-{round((p / (1 - p)) * 100)}"
    return f"+{round(((1 - p) / p) * 100)}"

@router.get("/")
def get_best_bets(course_id: str = Query("masters"), min_edge: float = Query(0.08)):
    course = COURSES_DB.get(course_id)
    if not course:
        return {"error": "Course not found"}

    bets = []
    for player in PLAYERS_DB:
        pid = player["id"]
        vegas = SIMULATED_ODDS.get(pid, {})
        model = model_probabilities(player, course, pid)

        for bet_type in ["top5", "top10", "top20", "make_cut"]:
            edge = round(model[bet_type] - vegas.get(bet_type, 0.5), 3)
            if edge >= min_edge:
                bets.append({
                    "player_id": pid,
                    "player_name": player["name"],
                    "world_rank": player["world_rank"],
                    "bet_type": bet_type.replace("top", "Top ").replace("make_cut", "Make Cut"),
                    "model_probability": model[bet_type],
                    "vegas_implied": vegas.get(bet_type, 0.5),
                    "edge": edge,
                    "model_odds": prob_to_american_odds(model[bet_type]),
                    "vegas_odds": prob_to_american_odds(vegas.get(bet_type, 0.5)),
                    "confidence": "High" if edge >= 0.20 else "Medium" if edge >= 0.12 else "Low",
                })

    bets.sort(key=lambda x: x["edge"], reverse=True)
    return {
        "course": course["name"],
        "total_edges_found": len(bets),
        "bets": bets[:10],
    }
