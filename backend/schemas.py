"""Pydantic schemas for request validation and response serialization."""

from datetime import datetime
from typing import Optional, Dict, List, Any

from pydantic import BaseModel, EmailStr


# -- Auth --

class RegisterRequest(BaseModel):
    """New user registration payload."""
    email: EmailStr
    full_name: str
    institution: Optional[str] = None
    password: str


class LoginRequest(BaseModel):
    """Login credentials."""
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """JWT token returned after successful login."""
    access_token: str
    token_type: str = "bearer"
    role: str


class UserResponse(BaseModel):
    """Public user profile."""
    id: str
    email: str
    full_name: str
    institution: Optional[str]
    role: str
    created_at: datetime

    model_config = {"from_attributes": True}


# -- Scan --

class LinkScanRequest(BaseModel):
    """URL to scan."""
    url: str


class ScanResultResponse(BaseModel):
    """Standardized scan result returned to the client."""
    id: str
    scan_type: str
    target: str
    verdict: str
    severity: float
    category: str
    engine_results: Optional[Dict[str, Any]] = None
    explanation: Optional[List[str]] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class ScanHistoryResponse(BaseModel):
    """Paginated list of scans."""
    items: List[ScanResultResponse]
    total: int
    page: int
    page_size: int


# -- Admin --

class AdminStatsResponse(BaseModel):
    """Aggregated dashboard statistics."""
    total_scans_today: int
    threats_blocked: int
    active_users: int
    detection_rate: float
    threats_by_category: Dict[str, int]
    scans_over_7_days: List[Dict[str, Any]]


class AlertResponse(BaseModel):
    """Alert record for admin dashboard."""
    id: str
    scan_id: str
    message: str
    severity: str
    acknowledged: bool
    created_at: datetime

    model_config = {"from_attributes": True}
