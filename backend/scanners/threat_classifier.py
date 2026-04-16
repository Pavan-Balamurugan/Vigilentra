"""Threat classifier that maps scan signals to standardized categories."""

from backend.scanners.base import ScanResult

CATEGORIES = [
    "phishing",
    "malware",
    "scam",
    "spam",
    "suspicious_redirect",
    "macro_threat",
    "data_exfiltration",
    "unknown",
]


def classify_threat(result: ScanResult) -> ScanResult:
    """Refine the threat category of a scan result based on engine signals.

    Examines the engine_results and explanation fields to assign the most
    specific category possible.

    Args:
        result: A ScanResult from any scanner.

    Returns:
        The same ScanResult with an updated category field.
    """
    if result.verdict == "safe":
        result.category = "unknown"
        return result

    explanation_text = " ".join(result.explanation).lower()
    engines = result.engine_results

    # Check for macro threats
    office = engines.get("office_analysis", {})
    if office.get("has_macros") or office.get("auto_exec"):
        result.category = "macro_threat"
        return result

    # Check for malware signals from VirusTotal
    vt = engines.get("virustotal", {})
    vt_file = engines.get("virustotal_file", {})
    malicious_count = vt.get("malicious", 0) + vt_file.get("malicious", 0)
    if malicious_count >= 5:
        result.category = "malware"
        return result

    # Check Safe Browsing results
    sb = engines.get("safe_browsing", {})
    sb_threats = sb.get("threats", [])
    if "MALWARE" in sb_threats:
        result.category = "malware"
        return result
    if "SOCIAL_ENGINEERING" in sb_threats:
        result.category = "phishing"
        return result

    # Heuristic-based classification
    if "typosquatting" in explanation_text or "phishing" in explanation_text:
        result.category = "phishing"
    elif "shortener" in explanation_text or "redirect" in explanation_text:
        result.category = "suspicious_redirect"
    elif "payment" in explanation_text or "large payment" in explanation_text:
        result.category = "scam"
    elif "javascript" in explanation_text and "pdf" in explanation_text:
        result.category = "malware"
    elif result.category == "unknown" and result.verdict == "malicious":
        result.category = "malware"
    elif result.category == "unknown" and result.verdict == "suspicious":
        result.category = "unknown"

    return result
