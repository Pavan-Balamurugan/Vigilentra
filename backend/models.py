"""SQLAlchemy ORM models for the Vigilentra database."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, Integer, Float, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship

from backend.database import Base


def _utcnow() -> datetime:
    """Return timezone-aware UTC timestamp."""
    return datetime.now(timezone.utc)


def _new_id() -> str:
    """Generate a new UUID4 string for use as a primary key."""
    return str(uuid.uuid4())


class User(Base):
    """Registered user account."""

    __tablename__ = "users"

    id = Column(String, primary_key=True, default=_new_id)
    email = Column(String, unique=True, nullable=False, index=True)
    full_name = Column(String, nullable=False)
    institution = Column(String, nullable=True)
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=False, default="user")
    created_at = Column(DateTime, default=_utcnow)

    scans = relationship("Scan", back_populates="user", cascade="all, delete-orphan")


class Scan(Base):
    """Record of a single scan operation."""

    __tablename__ = "scans"

    id = Column(String, primary_key=True, default=_new_id)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    scan_type = Column(String, nullable=False)  # link, qr, document
    target = Column(String, nullable=False)  # URL or filename
    verdict = Column(String, nullable=False)  # safe, suspicious, malicious
    severity = Column(Float, nullable=False, default=0.0)
    category = Column(String, nullable=False, default="unknown")
    engine_results = Column(JSON, nullable=True)
    explanation = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=_utcnow, index=True)

    user = relationship("User", back_populates="scans")


class Alert(Base):
    """System alert generated when a malicious scan is detected."""

    __tablename__ = "alerts"

    id = Column(String, primary_key=True, default=_new_id)
    scan_id = Column(String, ForeignKey("scans.id"), nullable=False)
    message = Column(Text, nullable=False)
    severity = Column(String, nullable=False, default="high")
    acknowledged = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, default=_utcnow, index=True)

    scan = relationship("Scan")


class CacheEntry(Base):
    """Cache for external API results to conserve quota."""

    __tablename__ = "cache_entries"

    id = Column(String, primary_key=True, default=_new_id)
    cache_key = Column(String, unique=True, nullable=False, index=True)
    result = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=_utcnow)
