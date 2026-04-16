"""Admin routes: dashboard statistics, threat feed, user management, and alerts."""

from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from backend.auth import get_db
from backend.dependencies import require_admin
from backend.models import User, Scan, Alert
from backend.schemas import (
    AdminStatsResponse,
    ScanResultResponse,
    ScanHistoryResponse,
    UserResponse,
    AlertResponse,
)

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/stats", response_model=AdminStatsResponse)
def get_admin_stats(
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
) -> dict:
    """Return aggregated dashboard statistics for the admin panel.

    Includes total scans today, threats blocked, active users,
    detection rate, threats by category, and scans over the last 7 days.

    Args:
        db: Database session.
        _admin: The authenticated admin user (used for authorization only).

    Returns:
        Aggregated statistics dictionary.
    """
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_ago = now - timedelta(days=7)

    # Total scans today
    total_scans_today = (
        db.query(func.count(Scan.id))
        .filter(Scan.created_at >= today_start)
        .scalar()
    )

    # Threats blocked (malicious + suspicious today)
    threats_blocked = (
        db.query(func.count(Scan.id))
        .filter(Scan.created_at >= today_start)
        .filter(Scan.verdict.in_(["malicious", "suspicious"]))
        .scalar()
    )

    # Active users (users who scanned in the last 7 days)
    active_users = (
        db.query(func.count(func.distinct(Scan.user_id)))
        .filter(Scan.created_at >= week_ago)
        .scalar()
    )

    # Detection rate
    total_all = db.query(func.count(Scan.id)).scalar() or 1
    threats_all = (
        db.query(func.count(Scan.id))
        .filter(Scan.verdict.in_(["malicious", "suspicious"]))
        .scalar()
    )
    detection_rate = round((threats_all / total_all) * 100, 1)

    # Threats by category
    category_rows = (
        db.query(Scan.category, func.count(Scan.id))
        .filter(Scan.verdict.in_(["malicious", "suspicious"]))
        .group_by(Scan.category)
        .all()
    )
    threats_by_category = {row[0]: row[1] for row in category_rows}

    # Scans over last 7 days
    scans_over_7_days = []
    for i in range(7):
        day = (now - timedelta(days=6 - i)).date()
        day_start = datetime(day.year, day.month, day.day, tzinfo=timezone.utc)
        day_end = day_start + timedelta(days=1)
        count = (
            db.query(func.count(Scan.id))
            .filter(Scan.created_at >= day_start, Scan.created_at < day_end)
            .scalar()
        )
        scans_over_7_days.append({
            "date": day.isoformat(),
            "count": count,
        })

    return {
        "total_scans_today": total_scans_today,
        "threats_blocked": threats_blocked,
        "active_users": active_users,
        "detection_rate": detection_rate,
        "threats_by_category": threats_by_category,
        "scans_over_7_days": scans_over_7_days,
    }


@router.get("/threats", response_model=ScanHistoryResponse)
def get_threats(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
) -> dict:
    """Return all flagged scans (suspicious or malicious), paginated.

    Args:
        page: Page number.
        page_size: Items per page.
        db: Database session.
        _admin: The authenticated admin user.

    Returns:
        Paginated threat listing.
    """
    query = (
        db.query(Scan)
        .filter(Scan.verdict.in_(["malicious", "suspicious"]))
    )
    total = query.count()
    items = (
        query.order_by(Scan.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return {"items": items, "total": total, "page": page, "page_size": page_size}


@router.get("/users", response_model=list[UserResponse])
def get_users(
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
) -> list:
    """Return all registered users.

    Args:
        db: Database session.
        _admin: The authenticated admin user.

    Returns:
        List of user profiles.
    """
    return db.query(User).order_by(User.created_at.desc()).all()


@router.get("/alerts", response_model=list[AlertResponse])
def get_alerts(
    acknowledged: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
) -> list:
    """Return system alerts, optionally filtered by acknowledgement status.

    Args:
        acknowledged: Filter by acknowledged state.
        db: Database session.
        _admin: The authenticated admin user.

    Returns:
        List of alerts.
    """
    query = db.query(Alert)
    if acknowledged is not None:
        query = query.filter(Alert.acknowledged == int(acknowledged))
    return query.order_by(Alert.created_at.desc()).limit(50).all()


@router.post("/alerts/{alert_id}/acknowledge")
def acknowledge_alert(
    alert_id: str,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
) -> dict:
    """Mark an alert as acknowledged.

    Args:
        alert_id: The alert ID.
        db: Database session.
        _admin: The authenticated admin user.

    Returns:
        Confirmation message.
    """
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        from fastapi import HTTPException, status
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found")

    alert.acknowledged = 1
    db.commit()
    return {"message": "Alert acknowledged"}
