"""
Central config. All values come from environment variables.
In Cloud Run, set these via Secret Manager (--set-secrets) or plain env vars.
Locally, copy .env.example → .env and fill in values.
"""

from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # ── The Odds API ─────────────────────────────────────────────────────────
    odds_api_key: str                           # ODDS_API_KEY env var
    odds_api_base_url: str = "https://api.the-odds-api.com"

    # ── FSU Admin ────────────────────────────────────────────────────────────
    # Used to create / revoke FSU consumer keys via POST /v1/keys
    admin_key: str                              # ADMIN_KEY env var

    # ── GCP / Firestore ──────────────────────────────────────────────────────
    gcp_project: str = "chimera-v4"
    firestore_cache_collection: str  = "fsu_1x_cache"
    firestore_keys_collection: str   = "fsu_1x_api_keys"

    # ── Cache TTLs (seconds) ─────────────────────────────────────────────────
    cache_ttl_sports: int    = 3600   # sports list — rarely changes
    cache_ttl_pre_match: int = 300    # pre-match odds — 5 min
    cache_ttl_in_play: int   = 60     # in-play odds — 1 min

    # ── CORS ─────────────────────────────────────────────────────────────────
    allowed_origins: List[str] = ["*"]  # tighten to Cloudflare domain in prod

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
