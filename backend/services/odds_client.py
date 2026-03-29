"""
Async HTTP client for The Odds API v4.
All calls are cached via Firestore.
Quota headers are captured and returned alongside data.
"""

import httpx
from typing import Optional
from fastapi import HTTPException

from config import settings
from services.cache import get_cached, set_cached, make_cache_key


class OddsAPIClient:
    BASE = settings.odds_api_base_url

    def __init__(self):
        self._client = httpx.AsyncClient(timeout=15.0)

    # ── Internal ─────────────────────────────────────────────────────────────

    async def _get(self, path: str, params: dict) -> tuple[any, dict]:
        """
        Make a GET request to The Odds API.
        Returns (data, quota_headers).
        Raises HTTPException on non-200 responses.
        """
        params["apiKey"] = settings.odds_api_key

        resp = await self._client.get(f"{self.BASE}{path}", params=params)

        quota = {
            "requests_remaining": resp.headers.get("x-requests-remaining"),
            "requests_used":      resp.headers.get("x-requests-used"),
            "requests_last":      resp.headers.get("x-requests-last"),
        }

        if resp.status_code == 422:
            raise HTTPException(status_code=422, detail="Invalid parameters sent to The Odds API")
        if resp.status_code == 429:
            raise HTTPException(status_code=429, detail="The Odds API quota exhausted")
        if resp.status_code != 200:
            raise HTTPException(
                status_code=resp.status_code,
                detail=f"The Odds API error: {resp.text[:200]}",
            )

        return resp.json(), quota

    async def _cached_get(self, cache_key: str, path: str, params: dict, ttl: int) -> dict:
        """Get from cache or fetch live. Returns envelope with data + quota."""
        cached = await get_cached(cache_key)

        if cached is not None:
            return {**cached, "cache": "HIT"}

        data, quota = await self._get(path, params)
        payload = {"data": data, "quota": quota, "cache": "MISS"}
        await set_cached(cache_key, payload, ttl)
        return {**payload, "cache": "MISS"}

    # ── Public methods ────────────────────────────────────────────────────────

    async def get_sports(self, all_sports: bool = False) -> dict:
        """GET /v4/sports — returns all in-season (or all) sports."""
        params = {}
        if all_sports:
            params["all"] = "true"

        cache_key = make_cache_key("sports", all=all_sports)
        return await self._cached_get(
            cache_key, "/v4/sports", params, settings.cache_ttl_sports
        )

    async def get_odds(
        self,
        sport: str,
        regions: str = "uk",
        markets: str = "h2h",
        odds_format: str = "decimal",
        event_ids: Optional[str] = None,
        bookmakers: Optional[str] = None,
        commence_time_from: Optional[str] = None,
        commence_time_to: Optional[str] = None,
    ) -> dict:
        """GET /v4/sports/{sport}/odds"""
        params = {
            "regions":     regions,
            "markets":     markets,
            "oddsFormat":  odds_format,
        }
        if event_ids:          params["eventIds"]          = event_ids
        if bookmakers:         params["bookmakers"]         = bookmakers
        if commence_time_from: params["commenceTimeFrom"]   = commence_time_from
        if commence_time_to:   params["commenceTimeTo"]     = commence_time_to

        cache_key = make_cache_key("odds", sport=sport, **params)

        # Use in-play TTL if market is live (commence_time_from is None = could be live)
        ttl = settings.cache_ttl_pre_match
        return await self._cached_get(cache_key, f"/v4/sports/{sport}/odds", params, ttl)

    async def get_events(
        self,
        sport: str,
        commence_time_from: Optional[str] = None,
        commence_time_to: Optional[str] = None,
    ) -> dict:
        """GET /v4/sports/{sport}/events — no quota cost."""
        params: dict = {}
        if commence_time_from: params["commenceTimeFrom"] = commence_time_from
        if commence_time_to:   params["commenceTimeTo"]   = commence_time_to

        cache_key = make_cache_key("events", sport=sport, **params)
        return await self._cached_get(
            cache_key, f"/v4/sports/{sport}/events", params, settings.cache_ttl_pre_match
        )

    async def get_scores(
        self,
        sport: str,
        days_from: Optional[int] = None,
    ) -> dict:
        """GET /v4/sports/{sport}/scores"""
        params: dict = {}
        if days_from: params["daysFrom"] = days_from

        cache_key = make_cache_key("scores", sport=sport, **params)
        # Scores for live events need short TTL
        ttl = settings.cache_ttl_in_play
        return await self._cached_get(cache_key, f"/v4/sports/{sport}/scores", params, ttl)

    async def get_event_odds(
        self,
        sport: str,
        event_id: str,
        regions: str = "uk",
        markets: str = "h2h",
        odds_format: str = "decimal",
    ) -> dict:
        """GET /v4/sports/{sport}/events/{eventId}/odds"""
        params = {
            "regions":    regions,
            "markets":    markets,
            "oddsFormat": odds_format,
        }
        cache_key = make_cache_key("event_odds", sport=sport, event_id=event_id, **params)
        return await self._cached_get(
            cache_key,
            f"/v4/sports/{sport}/events/{event_id}/odds",
            params,
            settings.cache_ttl_pre_match,
        )


# Singleton
odds_client = OddsAPIClient()
