from fastapi import APIRouter, Query
from typing import Optional
import httpx
import os

router = APIRouter()

# --- Simulated 2025 season SG data (replace with DataGolf API key) ---
PLAYERS_DB = [
    {"id": 1, "name": "Scottie Scheffler",  "world_rank": 1,  "sg_ott": 0.82, "sg_app": 1.34, "sg_arg": 0.41, "sg_putt": 0.18, "sg_total": 2.75, "driving_dist": 312, "driving_acc": 61, "gir": 74, "scrambling": 68, "recent_form": [1,1,2,3,1]},
    {"id": 2, "name": "Rory McIlroy",       "world_rank": 2,  "sg_ott": 1.21, "sg_app": 0.98, "sg_arg": 0.22, "sg_putt": 0.31, "sg_total": 2.72, "driving_dist": 328, "driving_acc": 58, "gir": 72, "scrambling": 62, "recent_form": [4,2,1,6,3]},
    {"id": 3, "name": "Jon Rahm",           "world_rank": 3,  "sg_ott": 0.54, "sg_app": 1.18, "sg_arg": 0.55, "sg_putt": 0.28, "sg_total": 2.55, "driving_dist": 305, "driving_acc": 64, "gir": 71, "scrambling": 70, "recent_form": [2,5,3,1,4]},
    {"id": 4, "name": "Xander Schauffele",  "world_rank": 4,  "sg_ott": 0.71, "sg_app": 1.02, "sg_arg": 0.38, "sg_putt": 0.44, "sg_total": 2.55, "driving_dist": 308, "driving_acc": 63, "gir": 73, "scrambling": 66, "recent_form": [3,7,5,2,8]},
    {"id": 5, "name": "Viktor Hovland",     "world_rank": 5,  "sg_ott": 0.88, "sg_app": 0.84, "sg_arg": 0.18, "sg_putt": 0.12, "sg_total": 2.02, "driving_dist": 315, "driving_acc": 60, "gir": 70, "scrambling": 60, "recent_form": [8,4,9,5,6]},
    {"id": 6, "name": "Collin Morikawa",    "world_rank": 6,  "sg_ott": 0.22, "sg_app": 1.28, "sg_arg": 0.31, "sg_putt": 0.08, "sg_total": 1.89, "driving_dist": 298, "driving_acc": 68, "gir": 76, "scrambling": 67, "recent_form": [6,3,4,8,2]},
    {"id": 7, "name": "Patrick Cantlay",    "world_rank": 7,  "sg_ott": 0.38, "sg_app": 0.88, "sg_arg": 0.52, "sg_putt": 0.58, "sg_total": 2.36, "driving_dist": 301, "driving_acc": 66, "gir": 72, "scrambling": 71, "recent_form": [5,6,7,4,5]},
    {"id": 8, "name": "Ludvig Åberg",       "world_rank": 8,  "sg_ott": 0.65, "sg_app": 0.92, "sg_arg": 0.28, "sg_putt": 0.22, "sg_total": 2.07, "driving_dist": 318, "driving_acc": 62, "gir": 71, "scrambling": 63, "recent_form": [7,8,6,7,9]},
    {"id": 9, "name": "Max Homa",           "world_rank": 9,  "sg_ott": 0.44, "sg_app": 0.76, "sg_arg": 0.44, "sg_putt": 0.52, "sg_total": 2.16, "driving_dist": 302, "driving_acc": 65, "gir": 69, "scrambling": 69, "recent_form": [9,10,8,10,7]},
    {"id": 10,"name": "Tom Kim",            "world_rank": 10, "sg_ott": 0.58, "sg_app": 0.71, "sg_arg": 0.35, "sg_putt": 0.48, "sg_total": 2.12, "driving_dist": 307, "driving_acc": 61, "gir": 68, "scrambling": 65, "recent_form": [10,9,10,9,10]},
]

DATAGOLF_KEY = os.getenv("DATAGOLF_API_KEY", "")

async def fetch_datagolf_live():
    """Fetch live SG data from DataGolf API if key is present."""
    if not DATAGOLF_KEY:
        return None
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.get(
                "https://feeds.datagolf.com/preds/skill-ratings",
                params={"key": DATAGOLF_KEY, "display": "value", "file_format": "json"}
            )
            if r.status_code == 200:
                return r.json()
    except Exception:
        pass
    return None

@router.get("/")
async def get_players(use_live: bool = Query(False)):
    """Return all player SG stats. Set use_live=true to pull DataGolf data."""
    if use_live:
        live = await fetch_datagolf_live()
        if live:
            return {"source": "datagolf_live", "players": live}
    return {"source": "simulated_2025", "players": PLAYERS_DB}

@router.get("/{player_id}")
async def get_player(player_id: int):
    player = next((p for p in PLAYERS_DB if p["id"] == player_id), None)
    if not player:
        return {"error": "Player not found"}
    return player

@router.get("/field/{tournament_id}")
async def get_field(tournament_id: str):
    """Return projected tournament field."""
    return {"tournament": tournament_id, "field": PLAYERS_DB}
