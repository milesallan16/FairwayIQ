from pydantic import BaseModel
from typing import Optional

class Player(BaseModel):
    id: int
    name: str
    world_rank: int
    sg_ott: float
    sg_app: float
    sg_arg: float
    sg_putt: float
    sg_total: float
    driving_distance: float
    driving_accuracy: float
    gir_pct: float
    scrambling_pct: float

class Course(BaseModel):
    id: str
    name: str
    tournament: str
    yardage: int
    green_type: str
    fairway_width: str
    rough_length: str
    weight_ott: float
    weight_app: float
    weight_arg: float
    weight_putt: float
    description: str
    key_metric: str

class FitScore(BaseModel):
    player_id: int
    player_name: str
    course_id: str
    fit_score: float
    projected_sg: float
    tier: str
    prob_top5: float
    prob_top10: float
    prob_top20: float
    prob_cut: float
    strengths: list[str]

class MatchupResult(BaseModel):
    player_a: str
    player_b: str
    course: str
    prob_a: float
    prob_b: float
    fit_a: float
    fit_b: float
    sg_diff: float
    key_edges: list[dict]
    model_pick: str

class BetEdge(BaseModel):
    player: str
    bet_type: str
    model_prob: float
    vegas_implied: float
    edge: float
    odds: str
    confidence: str
