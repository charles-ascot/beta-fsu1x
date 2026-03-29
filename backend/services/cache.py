"""
Firestore TTL cache.

Every cached entry stores:
  - data:       the response payload (dict)
  - expires_at: epoch timestamp (float)
  - source:     "the-odds-api"

Cache is keyed by a hash of the request parameters.
"""

import time
import json
import hashlib
from typing import Optional, Any

from google.cloud import firestore

from config import settings

_db: Optional[firestore.AsyncClient] = None


def _get_db() -> firestore.AsyncClient:
    global _db
    if _db is None:
        _db = firestore.AsyncClient(project=settings.gcp_project)
    return _db


def make_cache_key(namespace: str, **kwargs) -> str:
    """Deterministic cache key from namespace + sorted kwargs."""
    raw = namespace + json.dumps(kwargs, sort_keys=True)
    return hashlib.sha256(raw.encode()).hexdigest()[:40]


async def get_cached(key: str) -> Optional[Any]:
    """Return cached data if it exists and hasn't expired, else None."""
    db = _get_db()
    doc = await db.collection(settings.firestore_cache_collection).document(key).get()

    if not doc.exists:
        return None

    entry = doc.to_dict()

    if time.time() > entry.get("expires_at", 0):
        # Expired — delete async and return None
        await db.collection(settings.firestore_cache_collection).document(key).delete()
        return None

    return entry.get("data")


async def set_cached(key: str, data: Any, ttl: int) -> None:
    """Store data in Firestore with a TTL (seconds)."""
    db = _get_db()
    await db.collection(settings.firestore_cache_collection).document(key).set(
        {
            "data": data,
            "expires_at": time.time() + ttl,
            "source": "the-odds-api",
            "cached_at": time.time(),
        }
    )
