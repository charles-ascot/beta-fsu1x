"""GET /v1/scores/{sport} — live and recent scores."""

from typing import Optional
from fastapi import APIRouter, Path, Query
from services.odds_client import odds_client

router = APIRouter()


@router.get("/scores/{sport}", summary="Get scores for a sport")
async def get_scores(
    sport: str = Path(..., description="Sport key e.g. soccer_epl"),
    days_from: Optional[int] = Query(
        None,
        ge=1, le=3,
        description="Include completed games from this many days ago (1-3). Costs 2 quota.",
    ),
):
    """
    Returns live and upcoming events with scores where available.
    Live scores update approximately every 30 seconds (cached for 60s here).
    Quota cost: 1 for live/upcoming only; 2 if days_from is specified.
    """
    return await odds_client.get_scores(sport=sport, days_from=days_from)
