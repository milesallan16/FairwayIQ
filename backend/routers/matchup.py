from fastapi import APIRouter, Query
from routers.players import PLAYERS_DB
from routers.courses import COURSES_DB

router = APIRouter()

def compute_fit_score(player: dict, course: dict) -> float:
    w = course["sg_weights"]
    raw = (
        w["sg_ott"]  * player["sg_ott"] +
        w["sg_app"]  * player["sg_app"] +
        w["sg_arg"]  * player["sg_arg"] +
        w["sg_putt"] * player["sg_putt"]
    )
    # Normalize to 0–100 scale (max raw ~3.0)
    return round(min(raw / 3.0 * 100, 99.9), 1)

def recent_form_multiplier(player: dict) -> float:
    """Convert recent finish positions to a form multiplier (0.9–1.1)."""
    finishes = player.get("recent_form", [10, 10, 10, 10, 10])
    # Weight most recent events higher
    weights = [0.10, 0.15, 0.20, 0.25, 0.30]
    avg = sum(f * w for f, w in zip(finishes, weights))
    # Invert: lower finish = better form. Map avg 1–15 → multiplier 1.1–0.9
    return round(1.1 - (avg / 15) * 0.2, 3)

def sg_edge_breakdown(pa: dict, pb: dict, course: dict) -> list:
    cats = [
        ("Off-the-Tee", "sg_ott"),
        ("Approach",    "sg_app"),
        ("Around Green","sg_arg"),
        ("Putting",     "sg_putt"),
    ]
    result = []
    for label, key in cats:
        edge = round(pa[key] - pb[key], 3)
        weighted_edge = round(edge * course["sg_weights"][key], 3)
        result.append({
            "category": label,
            "player_a_val": pa[key],
            "player_b_val": pb[key],
            "raw_edge": edge,
            "weighted_edge": weighted_edge,
            "course_weight": course["sg_weights"][key],
            "advantage": pa["name"] if edge >= 0 else pb["name"],
        })
    return result

@router.get("/")
def matchup(
    player_a_id: int = Query(..., description="Player A ID"),
    player_b_id: int = Query(..., description="Player B ID"),
    course_id: str = Query("masters", description="Course/tournament ID"),
):
    pa = next((p for p in PLAYERS_DB if p["id"] == player_a_id), None)
    pb = next((p for p in PLAYERS_DB if p["id"] == player_b_id), None)
    course = COURSES_DB.get(course_id)

    if not pa or not pb:
        return {"error": "Player not found"}
    if not course:
        return {"error": "Course not found"}

    fit_a = compute_fit_score(pa, course)
    fit_b = compute_fit_score(pb, course)

    form_a = recent_form_multiplier(pa)
    form_b = recent_form_multiplier(pb)

    # Blend fit score (80%) + form (20%)
    adj_a = fit_a * 0.8 + fit_a * form_a * 0.2
    adj_b = fit_b * 0.8 + fit_b * form_b * 0.2

    total = adj_a + adj_b
    prob_a = round(adj_a / total * 100, 1)
    prob_b = round(100 - prob_a, 1)

    proj_sg_diff = round(pa["sg_total"] - pb["sg_total"], 2)

    breakdown = sg_edge_breakdown(pa, pb, course)
    top_edge = max(breakdown, key=lambda x: abs(x["weighted_edge"]))

    return {
        "course": course["name"],
        "player_a": {
            "id": pa["id"],
            "name": pa["name"],
            "world_rank": pa["world_rank"],
            "fit_score": fit_a,
            "form_multiplier": form_a,
            "adjusted_score": round(adj_a, 2),
            "win_probability": prob_a,
            "sg_stats": {k: pa[k] for k in ["sg_ott","sg_app","sg_arg","sg_putt","sg_total"]},
        },
        "player_b": {
            "id": pb["id"],
            "name": pb["name"],
            "world_rank": pb["world_rank"],
            "fit_score": fit_b,
            "form_multiplier": form_b,
            "adjusted_score": round(adj_b, 2),
            "win_probability": prob_b,
            "sg_stats": {k: pb[k] for k in ["sg_ott","sg_app","sg_arg","sg_putt","sg_total"]},
        },
        "model_pick": pa["name"] if prob_a >= prob_b else pb["name"],
        "projected_stroke_diff": proj_sg_diff,
        "key_advantage_category": top_edge["category"],
        "key_advantage_edge": top_edge["weighted_edge"],
        "sg_breakdown": breakdown,
    }

@router.get("/leaderboard")
def leaderboard(course_id: str = Query("masters")):
    course = COURSES_DB.get(course_id)
    if not course:
        return {"error": "Course not found"}

    scored = []
    for p in PLAYERS_DB:
        fit = compute_fit_score(p, course)
        form = recent_form_multiplier(p)
        adj = fit * 0.8 + fit * form * 0.2
        tier = (
            "Top 5" if fit >= 85 else
            "Top 10" if fit >= 75 else
            "Top 20" if fit >= 60 else
            "Cut Risk"
        )
        scored.append({
            "player_id": p["id"],
            "name": p["name"],
            "world_rank": p["world_rank"],
            "fit_score": fit,
            "adjusted_score": round(adj, 2),
            "form_multiplier": form,
            "projected_sg_total": round(p["sg_total"] * form, 2),
            "tier": tier,
            "sg_stats": {k: p[k] for k in ["sg_ott","sg_app","sg_arg","sg_putt","sg_total"]},
        })

    scored.sort(key=lambda x: x["adjusted_score"], reverse=True)
    for i, s in enumerate(scored):
        s["projected_position"] = i + 1

    return {"course": course["name"], "leaderboard": scored}
