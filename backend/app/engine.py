from app.data.seed import PLAYERS, COURSES

def compute_fit_score(player: dict, course: dict) -> float:
    raw = (
        course["weight_ott"]  * player["sg_ott"] +
        course["weight_app"]  * player["sg_app"] +
        course["weight_arg"]  * player["sg_arg"] +
        course["weight_putt"] * player["sg_putt"]
    )
    # Normalize to 0-100 scale (max raw ~3.0)
    score = round((raw / 3.0) * 100, 1)
    return min(max(score, 0), 100)

def get_tier(fit_score: float) -> str:
    if fit_score >= 85:   return "Top 5"
    if fit_score >= 75:   return "Top 10"
    if fit_score >= 60:   return "Top 20"
    return "Cut Risk"

def get_probabilities(fit_score: float) -> dict:
    # Sigmoid-like mapping from fit score to probabilities
    base = fit_score / 100
    return {
        "prob_top5":  round(base ** 1.4 * 0.85, 3),
        "prob_top10": round(base ** 1.1 * 0.88, 3),
        "prob_top20": round(base ** 0.85 * 0.90, 3),
        "prob_cut":   round(1 - base ** 0.5 * 0.85, 3),
    }

def get_strengths(player: dict, course: dict) -> list[str]:
    weighted = [
        ("Approach",      course["weight_app"]  * player["sg_app"]),
        ("Off-the-Tee",   course["weight_ott"]  * player["sg_ott"]),
        ("Around Green",  course["weight_arg"]  * player["sg_arg"]),
        ("Putting",       course["weight_putt"] * player["sg_putt"]),
    ]
    weighted.sort(key=lambda x: x[1], reverse=True)
    return [cat for cat, _ in weighted[:2]]

def rank_field(course_id: str) -> list[dict]:
    course = COURSES[course_id]
    results = []
    for p in PLAYERS:
        fit = compute_fit_score(p, course)
        probs = get_probabilities(fit)
        results.append({
            "player_id":    p["id"],
            "player_name":  p["name"],
            "world_rank":   p["world_rank"],
            "course_id":    course_id,
            "fit_score":    fit,
            "projected_sg": round(p["sg_total"] * 0.78, 2),
            "tier":         get_tier(fit),
            "strengths":    get_strengths(p, course),
            "sg_ott":       p["sg_ott"],
            "sg_app":       p["sg_app"],
            "sg_arg":       p["sg_arg"],
            "sg_putt":      p["sg_putt"],
            "sg_total":     p["sg_total"],
            **probs,
        })
    results.sort(key=lambda x: x["fit_score"], reverse=True)
    return results

def compute_matchup(player_a_id: int, player_b_id: int, course_id: str) -> dict:
    pa = next(p for p in PLAYERS if p["id"] == player_a_id)
    pb = next(p for p in PLAYERS if p["id"] == player_b_id)
    course = COURSES[course_id]

    fa = compute_fit_score(pa, course)
    fb = compute_fit_score(pb, course)
    total = fa + fb
    prob_a = round(fa / total, 3) if total > 0 else 0.5
    prob_b = round(1 - prob_a, 3)

    sg_cats = [
        {"category": "Off-the-Tee",  "weight": course["weight_ott"],  "a": pa["sg_ott"],  "b": pb["sg_ott"]},
        {"category": "Approach",     "weight": course["weight_app"],  "a": pa["sg_app"],  "b": pb["sg_app"]},
        {"category": "Around Green", "weight": course["weight_arg"],  "a": pa["sg_arg"],  "b": pb["sg_arg"]},
        {"category": "Putting",      "weight": course["weight_putt"], "a": pa["sg_putt"], "b": pb["sg_putt"]},
    ]
    for cat in sg_cats:
        cat["edge"] = round(cat["a"] - cat["b"], 2)
        cat["weighted_edge"] = round(cat["edge"] * cat["weight"], 3)
        cat["advantage"] = pa["name"] if cat["edge"] > 0 else pb["name"]

    return {
        "player_a":    pa["name"],
        "player_b":    pb["name"],
        "course":      course["tournament"],
        "prob_a":      prob_a,
        "prob_b":      prob_b,
        "fit_a":       fa,
        "fit_b":       fb,
        "sg_diff":     round(pa["sg_total"] - pb["sg_total"], 2),
        "key_edges":   sg_cats,
        "model_pick":  pa["name"] if prob_a >= prob_b else pb["name"],
    }
