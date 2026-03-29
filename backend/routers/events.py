"""GET /v1/events/{sport} — event list without odds (no quota cost)."""

from typing import Optional
from fastapi import APIRouter, Path, Query
from services.odds_client import odds_client

router = APIRouter()


@router.get("/events/{sport}", summary="List events for a sport")
async def get_events(
    sport: str = Path(..., description="Sport key e.g. soccer_epl"),
    commence_time_from: Optional[str] = Query(None, description="ISO 8601"),
    commence_time_to: Optional[str] = Query(None, description="ISO 8601"),
):
    """
    Returns upcoming and in-play events without odds.
    Use event IDs returned here to call /v1/odds/{sport}/{event_id}.
    Does not count against The Odds API quota.
    """
    return await odds_client.get_events(
        sport=sport,
        commence_time_from=commence_time_from,
        commence_time_to=commence_time_to,
    )
