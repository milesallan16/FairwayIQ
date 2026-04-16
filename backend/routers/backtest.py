from fastapi import APIRouter, Query
from routers.matchup import compute_fit_score
from routers.players import PLAYERS_DB
from routers.courses import COURSES_DB
import random
import math

router = APIRouter()

# Simulated historical results for backtesting
# Format: {course_id: [{player_id, actual_finish, season}]}
HISTORICAL_RESULTS = {
    "masters": [
        {"player_id": 1, "actual_finish": 1,  "season": 2024},
        {"player_id": 2, "actual_finish": 8,  "season": 2024},
        {"player_id": 3, "actual_finish": 3,  "season": 2024},
        {"player_id": 4, "actual_finish": 5,  "season": 2024},
        {"player_id": 6, "actual_finish": 12, "season": 2024},
        {"player_id": 7, "actual_finish": 2,  "season": 2024},
        {"player_id": 1, "actual_finish": 2,  "season": 2023},
        {"player_id": 2, "actual_finish": 4,  "season": 2023},
        {"player_id": 3, "actual_finish": 1,  "season": 2023},
        {"player_id": 5, "actual_finish": 10, "season": 2023},
    ],
    "players": [
        {"player_id": 2, "actual_finish": 1,  "season": 2024},
        {"player_id": 1, "actual_finish": 3,  "season": 2024},
        {"player_id": 4, "actual_finish": 6,  "season": 2024},
        {"player_id": 5, "actual_finish": 2,  "season": 2024},
        {"player_id": 3, "actual_finish": 14, "season": 2024},
    ],
    "torrey": [
        {"player_id": 2, "actual_finish": 1,  "season": 2024},
        {"player_id": 5, "actual_finish": 3,  "season": 2024},
        {"player_id": 1, "actual_finish": 4,  "season": 2024},
        {"player_id": 8, "actual_finish": 2,  "season": 2024},
    ],
}

def model_rank(player_id: int, course: dict) -> int:
    """Predict the player's ranked position in the field based on fit score."""
    players_with_scores = []
    for p in PLAYERS_DB:
        score = compute_fit_score(p, course)
        players_with_scores.append((p["id"], score))
    players_with_scores.sort(key=lambda x: x[1], reverse=True)
    for rank, (pid, _) in enumerate(players_with_scores, 1):
        if pid == player_id:
            return rank
    return len(PLAYERS_DB)

def rank_accuracy(predicted: int, actual: int, threshold: int) -> bool:
    """Check if model correctly predicted finish within a threshold bucket."""
    return predicted <= threshold and actual <= threshold

@router.get("/")
def run_backtest(course_id: str = Query("masters")):
    course = COURSES_DB.get(course_id)
    if not course:
        return {"error": "Course not found"}

    historical = HISTORICAL_RESULTS.get(course_id, [])
    if not historical:
        return {"error": "No historical data for this course"}

    results = []
    top5_correct = 0
    top10_correct = 0
    total = len(historical)

    for entry in historical:
        player = next((p for p in PLAYERS_DB if p["id"] == entry["player_id"]), None)
        if not player:
            continue

        predicted_rank = model_rank(player["id"], course)
        actual_finish = entry["actual_finish"]
        fit_score = compute_fit_score(player, course)

        # Check accuracy at different thresholds
        top5_hit  = rank_accuracy(predicted_rank, actual_finish, 5)
        top10_hit = rank_accuracy(predicted_rank, actual_finish, 10)

        if top5_hit:
            top5_correct += 1
        if top10_hit:
            top10_correct += 1

        error = abs(predicted_rank - actual_finish)
        results.append({
            "season": entry["season"],
            "player": player["name"],
            "fit_score": fit_score,
            "predicted_rank": predicted_rank,
            "actual_finish": actual_finish,
            "rank_error": error,
            "top5_correct": top5_hit,
            "top10_correct": top10_hit,
        })

    results.sort(key=lambda x: x["season"], reverse=True)

    mae = round(sum(r["rank_error"] for r in results) / total, 2) if total else 0
    top5_acc = round(top5_correct / total * 100, 1) if total else 0
    top10_acc = round(top10_correct / total * 100, 1) if total else 0

    # Correlation between fit score and actual finish (lower = better)
    xs = [r["fit_score"] for r in results]
    ys = [r["actual_finish"] for r in results]
    n = len(xs)
    if n > 1:
        mx, my = sum(xs)/n, sum(ys)/n
        num = sum((x-mx)*(y-my) for x,y in zip(xs,ys))
        den = math.sqrt(sum((x-mx)**2 for x in xs) * sum((y-my)**2 for y in ys))
        correlation = round(num/den, 3) if den else 0
    else:
        correlation = 0

    return {
        "course": course["name"],
        "seasons_analyzed": list(set(r["season"] for r in results)),
        "total_predictions": total,
        "metrics": {
            "mean_absolute_error": mae,
            "top5_accuracy_pct": top5_acc,
            "top10_accuracy_pct": top10_acc,
            "fit_score_correlation": correlation,
            "notes": "Negative correlation = higher fit score predicts lower (better) finish position"
        },
        "results": results,
        "weight_optimization_hint": {
            "description": "Run /api/backtest/optimize to find best SG weights via grid search",
            "current_weights": course["sg_weights"],
        }
    }

@router.get("/optimize")
def optimize_weights(course_id: str = Query("masters")):
    """Grid search over SG weights to minimize MAE on historical data."""
    course = COURSES_DB.get(course_id)
    historical = HISTORICAL_RESULTS.get(course_id, [])
    if not course or not historical:
        return {"error": "Insufficient data"}

    best_mae = float("inf")
    best_weights = course["sg_weights"].copy()

    # Coarse grid search (0.1 steps, must sum to 1.0)
    steps = [0.10, 0.15, 0.20, 0.25, 0.30, 0.35, 0.40]
    trials = 0
    for w_ott in steps:
        for w_app in steps:
            for w_arg in steps:
                w_putt = round(1.0 - w_ott - w_app - w_arg, 2)
                if w_putt < 0.05 or w_putt > 0.50:
                    continue
                trial_course = {**course, "sg_weights": {"sg_ott": w_ott, "sg_app": w_app, "sg_arg": w_arg, "sg_putt": w_putt}}
                errors = []
                for entry in historical:
                    player = next((p for p in PLAYERS_DB if p["id"] == entry["player_id"]), None)
                    if not player:
                        continue
                    pred = model_rank(player["id"], trial_course)
                    errors.append(abs(pred - entry["actual_finish"]))
                mae = sum(errors) / len(errors) if errors else 999
                trials += 1
                if mae < best_mae:
                    best_mae = mae
                    best_weights = trial_course["sg_weights"].copy()

    return {
        "course": course["name"],
        "trials_evaluated": trials,
        "original_weights": course["sg_weights"],
        "optimized_weights": best_weights,
        "optimized_mae": round(best_mae, 2),
        "original_mae": None,
        "recommendation": "Update COURSES_DB weights with optimized values and re-run backtest to validate improvement",
    }
