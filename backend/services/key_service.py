"""
FSU consumer API key management.
Keys are stored in Firestore and validated on every request via middleware.
"""

import uuid
import secrets
import time
from typing import Optional

from google.cloud import firestore

from config import settings

_db: Optional[firestore.AsyncClient] = None


def _get_db() -> firestore.AsyncClient:
    global _db
    if _db is None:
        _db = firestore.AsyncClient(project=settings.gcp_project)
    return _db


def _generate_key() -> str:
    """Generate a URL-safe FSU API key with a recognisable prefix."""
    return "fsu1x_" + secrets.token_urlsafe(32)


async def create_key(name: str, created_by: str = "admin") -> dict:
    """Create and persist a new FSU API key."""
    db = _get_db()
    key_id = str(uuid.uuid4())
    key_value = _generate_key()
    now = time.time()

    record = {
        "key_id":       key_id,
        "key":          key_value,
        "name":         name,
        "created_by":   created_by,
        "created_at":   now,
        "last_used_at": None,
        "call_count":   0,
        "is_active":    True,
    }

    await db.collection(settings.firestore_keys_collection).document(key_id).set(record)
    return record


async def list_keys() -> list[dict]:
    """Return all FSU API keys (active and inactive)."""
    db = _get_db()
    results = []
    async for doc in db.collection(settings.firestore_keys_collection).stream():
        results.append(doc.to_dict())
    return results


async def revoke_key(key_id: str) -> bool:
    """Set is_active=False on a key. Returns False if key not found."""
    db = _get_db()
    ref = db.collection(settings.firestore_keys_collection).document(key_id)
    doc = await ref.get()

    if not doc.exists:
        return False

    await ref.update({"is_active": False})
    return True


async def is_valid_key(key_value: str) -> bool:
    """
    Check if a key value is active.
    Also bumps last_used_at and call_count on each valid hit.
    """
    db = _get_db()

    query = (
        db.collection(settings.firestore_keys_collection)
        .where("key", "==", key_value)
        .where("is_active", "==", True)
        .limit(1)
    )

    docs = [doc async for doc in query.stream()]

    if not docs:
        return False

    await docs[0].reference.update(
        {
            "last_used_at": time.time(),
            "call_count":   firestore.Increment(1),
        }
    )
    return True
