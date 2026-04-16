"""QR code scanner that decodes images and routes payloads through appropriate analysis."""

import re
from typing import Optional
from urllib.parse import urlparse

from backend.scanners.base import ScanResult
from backend.scanners.link_scanner import scan_link


def _analyze_wifi_payload(payload: str) -> ScanResult:
    """Analyze a WIFI: configuration QR payload.

    Args:
        payload: The raw WIFI: payload string.

    Returns:
        ScanResult for the WIFI payload.
    """
    result = ScanResult(target=payload, scan_type="qr", category="unknown")
    reasons = []

    if "T:nopass" in payload or "T:;" in payload:
        reasons.append("WiFi network has no password (open network)")
        result.severity = 30
        result.verdict = "suspicious"
    elif "T:WEP" in payload:
        reasons.append("WiFi network uses WEP encryption (easily broken)")
        result.severity = 40
        result.verdict = "suspicious"

    # Extract SSID
    ssid_match = re.search(r"S:([^;]+)", payload)
    if ssid_match:
        ssid = ssid_match.group(1)
        reasons.append(f"WiFi SSID: {ssid}")

    result.explanation = reasons
    result.engine_results["wifi_analysis"] = {"flags": reasons}
    return result


def _analyze_upi_payload(payload: str) -> ScanResult:
    """Analyze a UPI payment QR payload.

    Args:
        payload: The raw upi:// payload string.

    Returns:
        ScanResult for the UPI payload.
    """
    result = ScanResult(target=payload, scan_type="qr")
    reasons = []

    # Extract amount if present
    amount_match = re.search(r"am=(\d+\.?\d*)", payload)
    if amount_match:
        amount = float(amount_match.group(1))
        if amount > 10000:
            reasons.append(f"Large payment amount detected: {amount}")
            result.severity = 50
            result.verdict = "suspicious"
            result.category = "scam"

    # Extract payee
    payee_match = re.search(r"pa=([^&]+)", payload)
    if payee_match:
        reasons.append(f"Payment to: {payee_match.group(1)}")

    result.explanation = reasons
    result.engine_results["upi_analysis"] = {"flags": reasons}
    return result


def _analyze_contact_payload(payload: str, prefix: str) -> ScanResult:
    """Analyze mailto: or tel: payloads.

    Args:
        payload: The raw payload string.
        prefix: The protocol prefix (mailto or tel).

    Returns:
        ScanResult for the contact payload.
    """
    result = ScanResult(target=payload, scan_type="qr")
    result.explanation = [f"QR code contains a {prefix} link: {payload}"]
    result.engine_results[f"{prefix}_analysis"] = {"target": payload}
    return result


def decode_qr_image(image_bytes: bytes) -> Optional[str]:
    """Decode a QR code from raw image bytes using pyzbar.

    Args:
        image_bytes: Raw bytes of the image file.

    Returns:
        The decoded payload string, or None if no QR code found.
    """
    try:
        from pyzbar.pyzbar import decode as pyzbar_decode
        from PIL import Image
        import io

        image = Image.open(io.BytesIO(image_bytes))
        decoded = pyzbar_decode(image)
        if decoded:
            return decoded[0].data.decode("utf-8", errors="replace")
        return None
    except ImportError:
        return None
    except Exception:
        return None


async def scan_qr(image_bytes: bytes) -> ScanResult:
    """Decode a QR code image and analyze the payload.

    Args:
        image_bytes: Raw bytes of the uploaded QR code image.

    Returns:
        ScanResult with analysis of the decoded payload.
    """
    payload = decode_qr_image(image_bytes)

    if payload is None:
        result = ScanResult(scan_type="qr", target="[no QR code found]")
        result.verdict = "safe"
        result.explanation = ["No QR code could be decoded from the uploaded image"]
        result.engine_results["decoder"] = {"status": "no_qr_found"}
        return result

    # Route based on payload type
    payload_lower = payload.lower()

    if payload_lower.startswith("http://") or payload_lower.startswith("https://"):
        result = await scan_link(payload)
        result.scan_type = "qr"
        result.engine_results["decoder"] = {"status": "decoded", "type": "url"}
        return result

    if payload_lower.startswith("wifi:"):
        return _analyze_wifi_payload(payload)

    if payload_lower.startswith("upi://"):
        return _analyze_upi_payload(payload)

    if payload_lower.startswith("mailto:"):
        return _analyze_contact_payload(payload, "mailto")

    if payload_lower.startswith("tel:"):
        return _analyze_contact_payload(payload, "tel")

    # Unknown payload type
    result = ScanResult(target=payload, scan_type="qr")
    result.explanation = [f"QR code contains plain text or unrecognized format"]
    result.engine_results["decoder"] = {"status": "decoded", "type": "text"}
    return result
