from fastapi import APIRouter
from app.data.seed import PLAYERS

router = APIRouter()

@router.get("/")
def get_players():
    return PLAYERS

@router.get("/{player_id}")
def get_player(player_id: int):
    player = next((p for p in PLAYERS if p["id"] == player_id), None)
    if not player:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Player not found")
    return player
