from fastapi import APIRouter, HTTPException
from app.engine import rank_field, get_probabilities
from app.data.seed import COURSES, VEGAS_ODDS

router = APIRouter()

def prob_to_american_odds(prob: float) -> str:
    if prob <= 0 or prob >= 1:
        return "N/A"
    if prob >= 0.5:
        return f"-{round((prob / (1 - prob)) * 100)}"
    else:
        return f"+{round(((1 - prob) / prob) * 100)}"

@router.get("/{course_id}")
def get_best_bets(course_id: str, min_edge: float = 0.08):
    if course_id not in COURSES:
        raise HTTPException(status_code=404, detail="Course not found")

    field = rank_field(course_id)
    vegas = VEGAS_ODDS.get(course_id, {})
    bets = []

    for player in field:
        name = player["player_name"]
        if name not in vegas:
            continue
        v = vegas[name]
        for bet_type, model_prob_key in [("Top 5 Finish","prob_top5"),("Top 10 Finish","prob_top10"),("Top 20 Finish","prob_top20")]:
            model_prob = player[model_prob_key]
            vkey = bet_type.lower().replace(" finish","").replace(" ","")
            vegas_implied = v.get(vkey, None)
            if vegas_implied is None:
                continue
            edge = round(model_prob - vegas_implied, 3)
            if edge >= min_edge:
                confidence = "High" if edge > 0.20 else "Medium" if edge > 0.12 else "Low"
                bets.append({
                    "player": name,
                    "bet_type": bet_type,
                    "model_prob": round(model_prob, 3),
                    "vegas_implied": round(vegas_implied, 3),
                    "edge": edge,
                    "odds": prob_to_american_odds(vegas_implied),
                    "confidence": confidence,
                    "fit_score": player["fit_score"],
                })

    bets.sort(key=lambda x: x["edge"], reverse=True)
    return {"course": COURSES[course_id]["tournament"], "bets": bets[:9]}
