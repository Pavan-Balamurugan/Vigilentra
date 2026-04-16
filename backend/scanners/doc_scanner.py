"""Document scanner for PDF, DOCX, and XLSX files.

Inspects documents for malicious indicators including embedded macros,
JavaScript actions, suspicious URLs, and known malware hashes.
"""

import hashlib
import io
import re
from typing import Optional

import httpx

from backend.scanners.base import ScanResult
from backend.config import settings


def _compute_sha256(data: bytes) -> str:
    """Compute SHA256 hash of file bytes.

    Args:
        data: Raw file bytes.

    Returns:
        Hex-encoded SHA256 hash string.
    """
    return hashlib.sha256(data).hexdigest()


def _detect_mime_type(data: bytes, filename: str) -> str:
    """Detect MIME type using python-magic with filename fallback.

    Args:
        data: Raw file bytes.
        filename: Original filename for extension-based fallback.

    Returns:
        MIME type string.
    """
    try:
        import magic
        mime = magic.from_buffer(data, mime=True)
        return mime
    except ImportError:
        ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
        mime_map = {
            "pdf": "application/pdf",
            "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "doc": "application/msword",
            "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "xls": "application/vnd.ms-excel",
        }
        return mime_map.get(ext, "application/octet-stream")


def _scan_pdf(data: bytes, filename: str) -> ScanResult:
    """Scan a PDF file for suspicious content.

    Checks for JavaScript actions, Launch actions, embedded URLs,
    and other potentially dangerous PDF features.

    Args:
        data: Raw PDF bytes.
        filename: Original filename.

    Returns:
        ScanResult with PDF analysis findings.
    """
    result = ScanResult(target=filename, scan_type="document")
    reasons = []
    flags = {}

    try:
        from pypdf import PdfReader

        reader = PdfReader(io.BytesIO(data))
        text_content = ""
        urls_found = []

        for page in reader.pages:
            page_text = page.extract_text() or ""
            text_content += page_text

            # Check annotations for URLs
            if page.get("/Annots"):
                for annot in page["/Annots"]:
                    annot_obj = annot.get_object() if hasattr(annot, "get_object") else annot
                    if isinstance(annot_obj, dict):
                        a_entry = annot_obj.get("/A", {})
                        if isinstance(a_entry, dict):
                            uri = a_entry.get("/URI", "")
                            if uri:
                                urls_found.append(str(uri))

        # Check for JavaScript
        raw_content = data.decode("latin-1", errors="replace")
        if "/JavaScript" in raw_content or "/JS" in raw_content:
            reasons.append("PDF contains JavaScript actions (potential exploit)")
            result.severity = max(result.severity, 70)
            flags["javascript"] = True

        if "/Launch" in raw_content:
            reasons.append("PDF contains Launch actions (can execute programs)")
            result.severity = max(result.severity, 80)
            flags["launch_action"] = True

        if "/OpenAction" in raw_content and "/JavaScript" in raw_content:
            reasons.append("PDF auto-executes JavaScript on open")
            result.severity = max(result.severity, 85)

        # Extract URLs from text
        url_pattern = re.compile(r"https?://[^\s<>\"']+")
        text_urls = url_pattern.findall(text_content)
        urls_found.extend(text_urls)

        if urls_found:
            flags["urls_found"] = len(urls_found)
            reasons.append(f"PDF contains {len(urls_found)} embedded URL(s)")

        flags["pages"] = len(reader.pages)

    except ImportError:
        reasons.append("pypdf not installed -- PDF content analysis skipped")
        flags["parser"] = "unavailable"
    except Exception as exc:
        reasons.append(f"PDF parsing error: {str(exc)}")
        flags["parser_error"] = str(exc)

    if result.severity >= 50:
        result.verdict = "malicious"
        result.category = "malware"
    elif result.severity >= 20:
        result.verdict = "suspicious"

    result.explanation = reasons
    result.engine_results["pdf_analysis"] = flags
    return result


def _scan_office_doc(data: bytes, filename: str) -> ScanResult:
    """Scan a DOCX, DOC, XLSX, or XLS file for macros and suspicious content.

    Uses oletools to detect VBA macros and dangerous auto-execution triggers.

    Args:
        data: Raw file bytes.
        filename: Original filename.

    Returns:
        ScanResult with office document analysis findings.
    """
    result = ScanResult(target=filename, scan_type="document")
    reasons = []
    flags = {}

    try:
        from oletools.olevba import VBA_Parser

        vba_parser = VBA_Parser(filename, data=data)

        if vba_parser.detect_vba_macros():
            flags["has_macros"] = True
            reasons.append("Document contains VBA macros")
            result.severity = max(result.severity, 40)

            for vba_type, keyword, description in vba_parser.analyze_macros():
                if vba_type == "AutoExec":
                    reasons.append(f"Auto-execution trigger found: {keyword}")
                    result.severity = max(result.severity, 75)
                    flags["auto_exec"] = True
                elif vba_type == "Suspicious":
                    reasons.append(f"Suspicious keyword: {keyword} -- {description}")
                    result.severity = max(result.severity, 60)
                elif vba_type == "IOC":
                    reasons.append(f"Indicator of compromise: {keyword}")
                    result.severity = max(result.severity, 70)

            vba_parser.close()
        else:
            flags["has_macros"] = False

    except ImportError:
        reasons.append("oletools not installed -- macro analysis skipped")
        flags["parser"] = "unavailable"
    except Exception as exc:
        reasons.append(f"Office document parsing error: {str(exc)}")
        flags["parser_error"] = str(exc)

    if result.severity >= 50:
        result.verdict = "malicious"
        result.category = "macro_threat"
    elif result.severity >= 20:
        result.verdict = "suspicious"

    result.explanation = reasons
    result.engine_results["office_analysis"] = flags
    return result


async def _virustotal_hash_check(file_hash: str) -> ScanResult:
    """Look up a file hash on VirusTotal.

    Args:
        file_hash: SHA256 hash of the file.

    Returns:
        ScanResult with VirusTotal file report findings.
    """
    result = ScanResult(scan_type="document")

    if not settings.VIRUSTOTAL_API_KEY:
        result.engine_results["virustotal_file"] = {"status": "skipped", "reason": "no API key"}
        return result

    headers = {"x-apikey": settings.VIRUSTOTAL_API_KEY}

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(
                f"https://www.virustotal.com/api/v3/files/{file_hash}",
                headers=headers,
            )

            if resp.status_code == 404:
                result.engine_results["virustotal_file"] = {"status": "not_found"}
                return result

            data = resp.json()

        stats = data.get("data", {}).get("attributes", {}).get("last_analysis_stats", {})
        malicious = stats.get("malicious", 0)
        suspicious = stats.get("suspicious", 0)
        total = sum(stats.values()) if stats else 0

        result.engine_results["virustotal_file"] = {
            "status": "complete",
            "sha256": file_hash,
            "malicious": malicious,
            "suspicious": suspicious,
            "total_engines": total,
        }

        if malicious >= 3:
            result.verdict = "malicious"
            result.severity = min(95, 50 + malicious * 3)
            result.category = "malware"
            result.explanation.append(
                f"VirusTotal: {malicious}/{total} engines flagged this file"
            )
        elif malicious >= 1 or suspicious >= 2:
            result.verdict = "suspicious"
            result.severity = max(result.severity, 35 + malicious * 5)
            result.explanation.append(
                f"VirusTotal: {malicious} malicious, {suspicious} suspicious detections"
            )

    except Exception as exc:
        result.engine_results["virustotal_file"] = {"status": "error", "reason": str(exc)}

    return result


async def scan_document(data: bytes, filename: str) -> ScanResult:
    """Scan an uploaded document file for threats.

    Performs MIME validation, content-specific analysis (PDF or Office),
    and VirusTotal hash lookup.

    Args:
        data: Raw file bytes.
        filename: Original filename.

    Returns:
        Merged ScanResult from all analysis engines.
    """
    mime = _detect_mime_type(data, filename)
    file_hash = _compute_sha256(data)

    # Route to appropriate content scanner
    if mime == "application/pdf" or filename.lower().endswith(".pdf"):
        content_result = _scan_pdf(data, filename)
    elif mime in (
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ) or filename.lower().rsplit(".", 1)[-1] in ("doc", "docx", "xls", "xlsx"):
        content_result = _scan_office_doc(data, filename)
    else:
        content_result = ScanResult(target=filename, scan_type="document")
        content_result.explanation = [f"Unsupported file type: {mime}"]
        content_result.engine_results["mime"] = {"detected": mime}

    content_result.engine_results["file_info"] = {
        "sha256": file_hash,
        "mime": mime,
        "size_bytes": len(data),
    }

    # VirusTotal hash check
    vt_result = await _virustotal_hash_check(file_hash)
    content_result.merge(vt_result)

    return content_result
