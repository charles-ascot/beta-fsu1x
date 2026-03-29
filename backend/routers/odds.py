"""
GET /v1/odds/{sport}           — odds for a sport across bookmakers
GET /v1/odds/{sport}/{event_id} — odds for a single event (all markets)
"""

from typing import Optional
from fastapi import APIRouter, Path, Query
from services.odds_client import odds_client

router = APIRouter()


@router.get("/odds/{sport}", summary="Get odds for a sport")
async def get_odds(
    sport: str = Path(..., description="Sport key e.g. soccer_epl, americanfootball_nfl"),
    regions: str = Query("uk", description="Comma-separated: uk, eu, us, au"),
    markets: str = Query("h2h", description="Comma-separated: h2h, spreads, totals, outrights"),
    odds_format: str = Query("decimal", description="decimal or american"),
    event_ids: Optional[str] = Query(None, description="Comma-separated event IDs to filter"),
    bookmakers: Optional[str] = Query(None, description="Comma-separated bookmaker keys to filter"),
    commence_time_from: Optional[str] = Query(None, description="ISO 8601 e.g. 2025-01-01T00:00:00Z"),
    commence_time_to: Optional[str] = Query(None, description="ISO 8601 e.g. 2025-01-01T23:59:59Z"),
):
    """
    Returns upcoming and live events with bookmaker odds.
    Lay odds from Betfair/Matchbook automatically included as h2h_lay market.
    Quota cost: 1 per region per market.
    """
    return await odds_client.get_odds(
        sport=sport,
        regions=regions,
        markets=markets,
        odds_format=odds_format,
        event_ids=event_ids,
        bookmakers=bookmakers,
        commence_time_from=commence_time_from,
        commence_time_to=commence_time_to,
    )


@router.get("/odds/{sport}/{event_id}", summary="Get odds for a single event")
async def get_event_odds(
    sport: str = Path(..., description="Sport key"),
    event_id: str = Path(..., description="Event ID from /v1/events/{sport}"),
    regions: str = Query("uk", description="Comma-separated regions"),
    markets: str = Query("h2h", description="Any supported market key"),
    odds_format: str = Query("decimal", description="decimal or american"),
):
    """
    Returns full odds for a single event. Supports all available market keys
    including player props and alternate lines.
    Quota cost: 1 per unique market per region.
    """
    return await odds_client.get_event_odds(
        sport=sport,
        event_id=event_id,
        regions=regions,
        markets=markets,
        odds_format=odds_format,
    )
