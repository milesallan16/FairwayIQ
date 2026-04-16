from fastapi import APIRouter

router = APIRouter()

COURSES_DB = {
    "masters": {
        "id": "masters",
        "name": "The Masters",
        "venue": "Augusta National GC",
        "yardage": 7510,
        "green_type": "Bentgrass",
        "fairway_width": "Moderate",
        "rough_length": "2.5\"",
        "historical_avg_score": 71.8,
        "sg_weights": {"sg_ott": 0.20, "sg_app": 0.35, "sg_arg": 0.28, "sg_putt": 0.17},
        "key_metric": "Approach",
        "course_note": "Augusta rewards precision iron play and elite short-game control. Second shot positioning is paramount. Bentgrass greens favor consistent putting strokes.",
        "historical_winners_profile": "Elite approach players who avoid big numbers",
    },
    "players": {
        "id": "players",
        "name": "The Players Championship",
        "venue": "TPC Sawgrass",
        "yardage": 7215,
        "green_type": "Bermuda",
        "fairway_width": "Tight",
        "rough_length": "3.5\"",
        "historical_avg_score": 71.2,
        "sg_weights": {"sg_ott": 0.28, "sg_app": 0.30, "sg_arg": 0.18, "sg_putt": 0.24},
        "key_metric": "Off-the-Tee",
        "course_note": "Accuracy off the tee is critical on Sawgrass's tight Pete Dye layout. Water hazards on 17 holes punish errant shots. Bermuda greens add putting complexity.",
        "historical_winners_profile": "Accurate drivers with elite putting on Bermuda",
    },
    "pebble": {
        "id": "pebble",
        "name": "US Open",
        "venue": "Pebble Beach GL",
        "yardage": 7040,
        "green_type": "Poa Annua",
        "fairway_width": "Narrow",
        "rough_length": "4.0\"",
        "historical_avg_score": 73.1,
        "sg_weights": {"sg_ott": 0.32, "sg_app": 0.28, "sg_arg": 0.22, "sg_putt": 0.18},
        "key_metric": "Off-the-Tee",
        "course_note": "Wind and narrow coastal fairways punish errant tee shots severely. Poa Annua greens become unpredictable as the day progresses.",
        "historical_winners_profile": "Ball-strikers who avoid rough and manage their game under pressure",
    },
    "torrey": {
        "id": "torrey",
        "name": "Farmers Insurance Open",
        "venue": "Torrey Pines (South)",
        "yardage": 7765,
        "green_type": "Bentgrass",
        "fairway_width": "Wide",
        "rough_length": "3.0\"",
        "historical_avg_score": 71.5,
        "sg_weights": {"sg_ott": 0.35, "sg_app": 0.32, "sg_arg": 0.15, "sg_putt": 0.18},
        "key_metric": "Off-the-Tee",
        "course_note": "Distance and power rewarded on this long layout. Wide fairways allow aggressive driving. Approach game must be elite given the length of the holes.",
        "historical_winners_profile": "Long hitters with elite approach games",
    },
    "memorial": {
        "id": "memorial",
        "name": "Memorial Tournament",
        "venue": "Muirfield Village GC",
        "yardage": 7392,
        "green_type": "Bentgrass",
        "fairway_width": "Moderate",
        "rough_length": "3.5\"",
        "historical_avg_score": 71.9,
        "sg_weights": {"sg_ott": 0.22, "sg_app": 0.35, "sg_arg": 0.25, "sg_putt": 0.18},
        "key_metric": "Approach",
        "course_note": "A Jack Nicklaus design demanding consistent ball-striking and precise iron play. Short-game excellence separates contenders from the field.",
        "historical_winners_profile": "Complete ball-strikers with strong short games",
    },
}

@router.get("/")
def get_courses():
    return {"courses": list(COURSES_DB.values())}

@router.get("/{course_id}")
def get_course(course_id: str):
    course = COURSES_DB.get(course_id)
    if not course:
        return {"error": "Course not found"}
    return course

@router.get("/{course_id}/weights")
def get_weights(course_id: str):
    course = COURSES_DB.get(course_id)
    if not course:
        return {"error": "Course not found"}
    return {"course_id": course_id, "weights": course["sg_weights"], "key_metric": course["key_metric"]}
