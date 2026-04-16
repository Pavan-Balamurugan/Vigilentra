"""Cache layer for external API results stored in the database.

Caches scan results keyed by a hash of the input (URL or file hash)
to reduce external API calls and conserve quota.
"""

import hashlib
import json
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any

from sqlalchemy.orm import Session

from backend.models import CacheEntry

CACHE_TTL_HOURS = 24


def _make_key(prefix: str, value: str) -> str:
    """Generate a cache key from a prefix and value.

    Args:
        prefix: Cache namespace (e.g. 'vt_url', 'sb_url').
        value: The value to hash.

    Returns:
        A string cache key.
    """
    h = hashlib.sha256(f"{prefix}:{value}".encode()).hexdigest()
    return f"{prefix}_{h[:16]}"


def get_cached(db: Session, prefix: str, value: str) -> Optional[Dict[str, Any]]:
    """Retrieve a cached result if it exists and is not expired.

    Args:
        db: Database session.
        prefix: Cache namespace.
        value: The lookup value.

    Returns:
        Cached result dict or None if not found / expired.
    """
    key = _make_key(prefix, value)
    entry = db.query(CacheEntry).filter(CacheEntry.cache_key == key).first()

    if entry is None:
        return None

    expiry = entry.created_at.replace(tzinfo=timezone.utc) + timedelta(hours=CACHE_TTL_HOURS)
    if datetime.now(timezone.utc) > expiry:
        db.delete(entry)
        db.commit()
        return None

    return entry.result


def set_cached(db: Session, prefix: str, value: str, result: Dict[str, Any]) -> None:
    """Store a result in the cache, replacing any existing entry for the same key.

    Args:
        db: Database session.
        prefix: Cache namespace.
        value: The lookup value.
        result: The result dict to cache.
    """
    key = _make_key(prefix, value)
    existing = db.query(CacheEntry).filter(CacheEntry.cache_key == key).first()

    if existing:
        existing.result = result
        existing.created_at = datetime.now(timezone.utc)
    else:
        entry = CacheEntry(cache_key=key, result=result)
        db.add(entry)

    db.commit()
