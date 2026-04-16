from fastapi import APIRouter, HTTPException
from app.engine import compute_matchup
from app.data.seed import COURSES

router = APIRouter()

@router.get("/{course_id}/{player_a_id}/{player_b_id}")
def get_matchup(course_id: str, player_a_id: int, player_b_id: int):
    if course_id not in COURSES:
        raise HTTPException(status_code=404, detail="Course not found")
    if player_a_id == player_b_id:
        raise HTTPException(status_code=400, detail="Must select two different players")
    return compute_matchup(player_a_id, player_b_id, course_id)
