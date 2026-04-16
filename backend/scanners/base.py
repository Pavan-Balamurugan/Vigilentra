"""Standardized scan result data structure used by all scanner modules."""

from dataclasses import dataclass, field, asdict
from typing import Dict, List, Any, Optional


@dataclass
class ScanResult:
    """Standardized result returned by every scanner.

    Attributes:
        verdict: One of 'safe', 'suspicious', or 'malicious'.
        severity: Risk score from 0 (safe) to 100 (critical).
        category: Threat category such as 'phishing', 'malware', etc.
        engine_results: Raw results from each analysis engine.
        explanation: Human-readable reasons for the verdict.
        target: The URL or filename that was scanned.
        scan_type: One of 'link', 'qr', or 'document'.
    """

    verdict: str = "safe"
    severity: float = 0.0
    category: str = "unknown"
    engine_results: Dict[str, Any] = field(default_factory=dict)
    explanation: List[str] = field(default_factory=list)
    target: str = ""
    scan_type: str = "link"

    def to_dict(self) -> Dict[str, Any]:
        """Convert this result to a plain dictionary."""
        return asdict(self)

    def merge(self, other: "ScanResult") -> None:
        """Merge another ScanResult into this one, keeping the worse verdict.

        Args:
            other: Another scan result to merge in.
        """
        verdict_order = {"safe": 0, "suspicious": 1, "malicious": 2}
        if verdict_order.get(other.verdict, 0) > verdict_order.get(self.verdict, 0):
            self.verdict = other.verdict
        if other.severity > self.severity:
            self.severity = other.severity
        if other.category != "unknown":
            self.category = other.category
        self.engine_results.update(other.engine_results)
        self.explanation.extend(other.explanation)
