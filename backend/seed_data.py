"""Seed script to populate the database with demo users and sample scan records."""

import random
import uuid
from datetime import datetime, timedelta, timezone

from backend.database import SessionLocal, init_db
from backend.auth import hash_password
from backend.models import User, Scan, Alert


VERDICTS = ["safe", "suspicious", "malicious"]
CATEGORIES = [
    "phishing", "malware", "scam", "spam",
    "suspicious_redirect", "macro_threat", "unknown",
]
SCAN_TYPES = ["link", "qr", "document"]

SAMPLE_URLS = [
    "https://google.com", "https://example.com/login",
    "https://paypa1-secure.tk/verify", "https://bit.ly/3xFakeLink",
    "https://amazon-deals.xyz/offer", "https://microsoft-support.ml/fix",
    "https://github.com/project", "https://safe-site.org/page",
    "https://bank-login.top/secure", "https://netflix-renew.gq/account",
    "https://university.edu/portal", "https://hostel-wifi.com/connect",
    "https://paytm-refund.click/claim", "https://linkedin.com/in/user",
    "https://dropbox.com/shared/file.pdf",
]

SAMPLE_FILES = [
    "report_2024.pdf", "invoice_march.docx", "budget.xlsx",
    "syllabus.pdf", "attendance.xlsx", "memo_internal.docx",
    "quarterly_results.pdf", "hostel_rules.pdf", "fee_receipt.docx",
    "exam_schedule.xlsx",
]


def seed() -> None:
    """Create demo users and 50 sample scans in the database."""
    init_db()
    db = SessionLocal()

    try:
        # Check if already seeded
        if db.query(User).filter(User.email == "admin@vigilentra.local").first():
            print("Database already seeded. Skipping.")
            return

        # Create admin user
        admin = User(
            id=str(uuid.uuid4()),
            email="admin@vigilentra.local",
            full_name="System Administrator",
            institution="Vigilentra HQ",
            hashed_password=hash_password("Admin@123"),
            role="admin",
        )
        db.add(admin)

        # Create regular users
        regular_users = []
        for i in range(1, 4):
            user = User(
                id=str(uuid.uuid4()),
                email=f"user{i}@test.local",
                full_name=f"Test User {i}",
                institution=f"Test Institution {i}",
                hashed_password=hash_password("User@123"),
                role="user",
            )
            db.add(user)
            regular_users.append(user)

        db.commit()

        all_users = [admin] + regular_users

        # Create 50 sample scans spread over 7 days
        now = datetime.now(timezone.utc)
        scans_created = []

        for i in range(50):
            user = random.choice(all_users)
            scan_type = random.choice(SCAN_TYPES)

            # Weighted verdict distribution: 60% safe, 25% suspicious, 15% malicious
            verdict_roll = random.random()
            if verdict_roll < 0.60:
                verdict = "safe"
                severity = random.uniform(0, 15)
                category = "unknown"
            elif verdict_roll < 0.85:
                verdict = "suspicious"
                severity = random.uniform(25, 55)
                category = random.choice(["phishing", "suspicious_redirect", "spam", "unknown"])
            else:
                verdict = "malicious"
                severity = random.uniform(60, 95)
                category = random.choice(["phishing", "malware", "scam", "macro_threat"])

            if scan_type == "link":
                target = random.choice(SAMPLE_URLS)
            elif scan_type == "qr":
                target = "qr_" + random.choice(SAMPLE_URLS).split("//")[1]
            else:
                target = random.choice(SAMPLE_FILES)

            # Spread over last 7 days
            hours_ago = random.uniform(0, 7 * 24)
            created_at = now - timedelta(hours=hours_ago)

            scan = Scan(
                id=str(uuid.uuid4()),
                user_id=user.id,
                scan_type=scan_type,
                target=target,
                verdict=verdict,
                severity=round(severity, 1),
                category=category,
                engine_results={
                    "heuristic": {"score": round(severity * 0.7, 1)},
                    "seed": True,
                },
                explanation=[f"Seeded sample scan ({verdict})"],
                created_at=created_at,
            )
            db.add(scan)
            scans_created.append(scan)

        db.commit()

        # Create alerts for malicious scans
        for scan in scans_created:
            if scan.verdict == "malicious":
                alert = Alert(
                    id=str(uuid.uuid4()),
                    scan_id=scan.id,
                    message=f"Malicious {scan.scan_type} detected: {scan.target[:80]}",
                    severity="high" if scan.severity >= 70 else "medium",
                    created_at=scan.created_at,
                )
                db.add(alert)

        db.commit()
        print(f"Seeded {len(all_users)} users and {len(scans_created)} scans.")

    finally:
        db.close()


if __name__ == "__main__":
    seed()
