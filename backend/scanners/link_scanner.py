"""Link scanner with heuristic analysis, Google Safe Browsing, and VirusTotal checks."""
 
import hashlib
import re
from typing import Optional
from urllib.parse import urlparse
 
import httpx
 
from backend.scanners.base import ScanResult
from backend.config import settings
 
# Top brands for typosquatting detection
TOP_BRANDS = [
    "google", "facebook", "paypal", "amazon", "microsoft", "apple",
    "netflix", "instagram", "whatsapp", "sbi", "hdfc", "icici", "paytm",
    "twitter", "linkedin", "dropbox", "chase", "wellsfargo", "bankofamerica",
]
 
SUSPICIOUS_TLDS = [".tk", ".ml", ".xyz", ".top", ".gq", ".ga", ".cf", ".buzz", ".work", ".click"]
 
# Keywords in domain names that strongly suggest payment scams or phishing
PAYMENT_SCAM_KEYWORDS = [
    "pay-", "pay_", "-pay", "payment", "paynow", "paysoon", "pay-soon",
    "secure-", "verify", "update-", "account-", "login-", "signin",
    "banking", "wallet", "transfer", "refund", "kyc", "reward", "prize",
    "lucky", "win-", "free-", "gift-", "claim",
]
 
URL_SHORTENERS = [
    "bit.ly", "tinyurl.com", "goo.gl", "t.co", "ow.ly", "is.gd",
    "buff.ly", "rebrand.ly", "cutt.ly", "shorturl.at",
]
 
 
def _heuristic_scan(url: str) -> ScanResult:
    """Run heuristic checks on a URL without any external API calls.
 
    Checks:
        - URL length (extremely long URLs are suspicious)
        - IP-based URLs instead of domain names
        - Known URL shortener services
        - Suspicious TLDs
        - Typosquatting against top brands
 
    Args:
        url: The URL string to analyze.
 
    Returns:
        A ScanResult with heuristic findings.
    """
    result = ScanResult(target=url, scan_type="link")
    parsed = urlparse(url)
    hostname = (parsed.hostname or "").lower()
    domain_full = hostname.replace("www.", "")
    reasons = []
 
    # Check for non-HTTPS — plain HTTP means no encryption, easy to intercept
    if parsed.scheme == "http":
        reasons.append("URL uses plain HTTP (not HTTPS) — connection is unencrypted and can be intercepted")
        result.severity = max(result.severity, 30)
 
    # Check for payment/scam keywords in the domain name
    for kw in PAYMENT_SCAM_KEYWORDS:
        if kw in domain_full:
            reasons.append(f"Domain contains suspicious keyword '{kw}' — commonly used in payment scams or phishing sites")
            result.severity = max(result.severity, 55)
            result.category = "scam"
            break
 
    # Check URL length
    if len(url) > 200:
        reasons.append("Unusually long URL (possible obfuscation)")
        result.severity = max(result.severity, 30)
 
    # Check for IP-based URL
    ip_pattern = re.compile(r"^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$")
    if ip_pattern.match(hostname):
        reasons.append("URL uses an IP address instead of a domain name")
        result.severity = max(result.severity, 40)
 
    # Check URL shorteners
    for shortener in URL_SHORTENERS:
        if hostname == shortener or hostname.endswith("." + shortener):
            reasons.append(f"URL uses a shortener service ({shortener})")
            result.severity = max(result.severity, 25)
            result.category = "suspicious_redirect"
            break
 
    # Check suspicious TLDs
    for tld in SUSPICIOUS_TLDS:
        if hostname.endswith(tld):
            reasons.append(f"Domain uses suspicious TLD ({tld})")
            result.severity = max(result.severity, 35)
            break
 
    # Typosquatting detection
    domain_parts = domain_full.split(".")
    domain_base = domain_parts[0] if domain_parts else ""
    for brand in TOP_BRANDS:
        if brand != domain_base and brand in domain_base and len(domain_base) < len(brand) + 5:
            reasons.append(f"Domain resembles '{brand}' (possible typosquatting)")
            result.severity = max(result.severity, 60)
            result.category = "phishing"
            break
 
    # Check for suspicious characters in domain
    if "@" in url.split("//")[-1].split("/")[0]:
        reasons.append("URL contains '@' symbol (possible credential phishing)")
        result.severity = max(result.severity, 50)
 
    # Multiple subdomains
    subdomain_count = hostname.count(".")
    if subdomain_count > 3:
        reasons.append(f"Excessive subdomains ({subdomain_count} levels)")
        result.severity = max(result.severity, 30)
 
    if result.severity >= 50:
        result.verdict = "malicious"
    elif result.severity >= 20:
        result.verdict = "suspicious"
 
    result.explanation = reasons
    result.engine_results["heuristic"] = {
        "flags": reasons,
        "score": result.severity,
    }
    return result
 
 
async def _safe_browsing_check(url: str) -> ScanResult:
    """Check a URL against the Google Safe Browsing API.
 
    Args:
        url: The URL to check.
 
    Returns:
        ScanResult with Safe Browsing findings.
    """
    result = ScanResult(target=url, scan_type="link")
 
    if not settings.SAFE_BROWSING_API_KEY:
        result.engine_results["safe_browsing"] = {"status": "skipped", "reason": "no API key"}
        return result
 
    api_url = (
        f"https://safebrowsing.googleapis.com/v4/threatMatches:find"
        f"?key={settings.SAFE_BROWSING_API_KEY}"
    )
    payload = {
        "client": {"clientId": "vigilentra", "clientVersion": "1.0"},
        "threatInfo": {
            "threatTypes": [
                "MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE",
                "POTENTIALLY_HARMFUL_APPLICATION",
            ],
            "platformTypes": ["ANY_PLATFORM"],
            "threatEntryTypes": ["URL"],
            "threatEntries": [{"url": url}],
        },
    }
 
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(api_url, json=payload)
            data = resp.json()
 
        matches = data.get("matches", [])
        if matches:
            threat_type = matches[0].get("threatType", "UNKNOWN")
            result.verdict = "malicious"
            result.severity = 90
            result.category = "malware" if "MALWARE" in threat_type else "phishing"
            result.explanation.append(
                f"Google Safe Browsing flagged this URL as {threat_type}"
            )
            result.engine_results["safe_browsing"] = {
                "status": "flagged",
                "threats": [m.get("threatType") for m in matches],
            }
        else:
            result.engine_results["safe_browsing"] = {"status": "clean"}
 
    except Exception as exc:
        result.engine_results["safe_browsing"] = {"status": "error", "reason": str(exc)}
 
    return result
 
 
async def _virustotal_check(url: str) -> ScanResult:
    """Check a URL against the VirusTotal API.
 
    Args:
        url: The URL to check.
 
    Returns:
        ScanResult with VirusTotal findings.
    """
    result = ScanResult(target=url, scan_type="link")
 
    if not settings.VIRUSTOTAL_API_KEY:
        result.engine_results["virustotal"] = {"status": "skipped", "reason": "no API key"}
        return result
 
    url_id = hashlib.sha256(url.encode()).hexdigest()
    headers = {"x-apikey": settings.VIRUSTOTAL_API_KEY}
 
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            # Submit URL for scanning
            submit_resp = await client.post(
                "https://www.virustotal.com/api/v3/urls",
                headers=headers,
                data={"url": url},
            )
 
            # Get analysis results using URL identifier
            import base64
            vt_url_id = base64.urlsafe_b64encode(url.encode()).decode().rstrip("=")
            resp = await client.get(
                f"https://www.virustotal.com/api/v3/urls/{vt_url_id}",
                headers=headers,
            )
            data = resp.json()
 
        stats = data.get("data", {}).get("attributes", {}).get("last_analysis_stats", {})
        malicious = stats.get("malicious", 0)
        suspicious = stats.get("suspicious", 0)
        total = sum(stats.values()) if stats else 0
 
        result.engine_results["virustotal"] = {
            "status": "complete",
            "malicious": malicious,
            "suspicious": suspicious,
            "total_engines": total,
        }
 
        if malicious >= 5:
            result.verdict = "malicious"
            result.severity = min(95, 50 + malicious * 3)
            result.category = "malware"
            result.explanation.append(
                f"VirusTotal: {malicious}/{total} engines flagged this URL as malicious"
            )
        elif malicious >= 1 or suspicious >= 2:
            result.verdict = "suspicious"
            result.severity = max(result.severity, 40 + malicious * 5)
            result.explanation.append(
                f"VirusTotal: {malicious} malicious, {suspicious} suspicious detections out of {total}"
            )
 
    except Exception as exc:
        result.engine_results["virustotal"] = {"status": "error", "reason": str(exc)}
 
    return result
 
 
async def scan_link(url: str) -> ScanResult:
    """Run all three scanning layers on a URL and merge results.
 
    Args:
        url: The URL to scan.
 
    Returns:
        A merged ScanResult combining heuristic, Safe Browsing, and VirusTotal results.
    """
    heuristic = _heuristic_scan(url)
    safe_browsing = await _safe_browsing_check(url)
    virustotal = await _virustotal_check(url)
 
    # Merge all results -- heuristic is the base
    heuristic.merge(safe_browsing)
    heuristic.merge(virustotal)
 
    return heuristic
 