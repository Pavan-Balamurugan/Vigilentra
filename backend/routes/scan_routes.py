"""Scan routes: link, QR, document scanning and scan history retrieval."""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, status
from sqlalchemy.orm import Session

from backend.auth import get_current_user, get_db
from backend.models import User, Scan, Alert
from backend.schemas import LinkScanRequest, ScanResultResponse, ScanHistoryResponse
from backend.scanners.link_scanner import scan_link
from backend.scanners.qr_scanner import scan_qr
from backend.scanners.doc_scanner import scan_document
from backend.scanners.threat_classifier import classify_threat
from backend.utils.rate_limit import check_rate_limit

router = APIRouter(prefix="/scan", tags=["scan"])


def _save_scan(db: Session, user: User, result) -> Scan:
    """Persist a scan result to the database and create an alert if malicious.

    Args:
        db: Database session.
        user: The user who initiated the scan.
        result: The ScanResult from the scanner.

    Returns:
        The persisted Scan ORM instance.
    """
    scan = Scan(
        user_id=user.id,
        scan_type=result.scan_type,
        target=result.target,
        verdict=result.verdict,
        severity=result.severity,
        category=result.category,
        engine_results=result.engine_results,
        explanation=result.explanation,
    )
    db.add(scan)
    db.commit()
    db.refresh(scan)

    # Create alert for malicious results
    if result.verdict == "malicious":
        alert = Alert(
            scan_id=scan.id,
            message=f"Malicious {result.scan_type} detected: {result.target[:100]}",
            severity="high" if result.severity >= 70 else "medium",
        )
        db.add(alert)
        db.commit()

    return scan


@router.post("/link", response_model=ScanResultResponse)
async def scan_link_endpoint(
    payload: LinkScanRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Scan:
    """Scan a URL for threats using heuristic, Safe Browsing, and VirusTotal engines.

    Args:
        payload: The URL to scan.
        db: Database session.
        current_user: The authenticated user.

    Returns:
        The scan result.
    """
    check_rate_limit(current_user.id)
    result = await scan_link(payload.url)
    result = classify_threat(result)
    return _save_scan(db, current_user, result)


@router.post("/qr", response_model=ScanResultResponse)
async def scan_qr_endpoint(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Scan:
    """Scan an uploaded QR code image.

    Args:
        file: The uploaded QR code image.
        db: Database session.
        current_user: The authenticated user.

    Returns:
        The scan result.
    """
    check_rate_limit(current_user.id)
    image_bytes = await file.read()
    result = await scan_qr(image_bytes)
    result = classify_threat(result)
    return _save_scan(db, current_user, result)


@router.post("/document", response_model=ScanResultResponse)
async def scan_document_endpoint(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Scan:
    """Scan an uploaded document file (PDF, DOCX, XLSX).

    Args:
        file: The uploaded document.
        db: Database session.
        current_user: The authenticated user.

    Returns:
        The scan result.
    """
    check_rate_limit(current_user.id)

    allowed_extensions = {"pdf", "doc", "docx", "xls", "xlsx"}
    ext = (file.filename or "").rsplit(".", 1)[-1].lower()
    if ext not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type. Allowed: {', '.join(allowed_extensions)}",
        )

    file_bytes = await file.read()
    result = await scan_document(file_bytes, file.filename or "unknown")
    result = classify_threat(result)
    return _save_scan(db, current_user, result)


@router.get("/history", response_model=ScanHistoryResponse)
def get_scan_history(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    verdict: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    """Retrieve the current user's scan history with optional filtering.

    Args:
        page: Page number (1-indexed).
        page_size: Number of items per page.
        verdict: Filter by verdict (safe, suspicious, malicious).
        search: Search in target field.
        db: Database session.
        current_user: The authenticated user.

    Returns:
        Paginated scan history.
    """
    query = db.query(Scan).filter(Scan.user_id == current_user.id)

    if verdict:
        query = query.filter(Scan.verdict == verdict)
    if search:
        query = query.filter(Scan.target.ilike(f"%{search}%"))

    total = query.count()
    items = (
        query.order_by(Scan.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
    }
