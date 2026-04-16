"""Simple in-memory per-user rate limiter."""

import time
from collections import defaultdict
from typing import Dict, List

from fastapi import HTTPException, status

from backend.config import settings


# In-memory store: user_id -> list of request timestamps
_request_log: Dict[str, List[float]] = defaultdict(list)


def check_rate_limit(user_id: str) -> None:
    """Check whether a user has exceeded the scan rate limit.

    Uses a sliding window of one minute. Cleans up expired entries on each call.

    Args:
        user_id: The ID of the user making the request.

    Raises:
        HTTPException: If the user has exceeded the rate limit.
    """
    now = time.time()
    window_start = now - 60.0
    max_requests = settings.RATE_LIMIT_PER_MINUTE

    # Clean expired timestamps
    _request_log[user_id] = [
        ts for ts in _request_log[user_id] if ts > window_start
    ]

    if len(_request_log[user_id]) >= max_requests:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded. Maximum {max_requests} scans per minute.",
        )

    _request_log[user_id].append(now)
