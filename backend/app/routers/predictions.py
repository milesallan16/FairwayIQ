from fastapi import APIRouter, HTTPException
from app.engine import rank_field
from app.data.seed import COURSES

router = APIRouter()

@router.get("/{course_id}")
def get_predictions(course_id: str):
    if course_id not in COURSES:
        raise HTTPException(status_code=404, detail="Course not found")
    return {
        "course": COURSES[course_id],
        "field": rank_field(course_id),
    }
