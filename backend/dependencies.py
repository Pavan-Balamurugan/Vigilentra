"""Shared FastAPI dependencies for route handlers."""

from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.auth import get_current_user, get_db
from backend.models import User


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Dependency that ensures the current user has admin privileges.

    Args:
        current_user: The authenticated user.

    Returns:
        The user if they have admin role.

    Raises:
        HTTPException: If the user is not an admin.
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return current_user
