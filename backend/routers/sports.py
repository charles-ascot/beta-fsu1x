"""GET /v1/sports — list in-season sports from The Odds API."""

from fastapi import APIRouter, Query
from services.odds_client import odds_client

router = APIRouter()


@router.get("/sports", summary="List in-season sports")
async def get_sports(
    all: bool = Query(False, description="Include out-of-season sports"),
):
    """
    Returns all sports currently available on The Odds API.
    This endpoint does not count against your Odds API quota.
    Cached for 1 hour.
    """
    return await odds_client.get_sports(all_sports=all)
