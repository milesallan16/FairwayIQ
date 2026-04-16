from fastapi import APIRouter, HTTPException
from app.data.seed import COURSES

router = APIRouter()

@router.get("/")
def get_courses():
    return list(COURSES.values())

@router.get("/{course_id}")
def get_course(course_id: str):
    if course_id not in COURSES:
        raise HTTPException(status_code=404, detail="Course not found")
    return COURSES[course_id]
