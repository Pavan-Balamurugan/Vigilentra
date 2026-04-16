# Vigilentra

Multi-format cyber threat detection system designed for educational institutions, hostels, and small businesses. Vigilentra scans URLs, QR codes, and documents for phishing, malware, and other cyber threats using a combination of heuristic analysis and external threat intelligence APIs.

Industry Partner: Harvio Tech Industries

## Tech Stack

**Backend:**
- Python 3.10+ with FastAPI
- SQLAlchemy ORM with SQLite
- JWT authentication (bcrypt password hashing)
- httpx for async HTTP requests to external APIs

**Frontend:**
- Vanilla JavaScript (ES Modules)
- HTML5 with Tailwind CSS (CDN)
- Chart.js for analytics visualizations
- No build tools or framework dependencies

**External APIs:**
- VirusTotal API (URL and file hash lookups)
- Google Safe Browsing API (URL threat matching)

## Prerequisites

- Python 3.10 or higher
- pip (Python package manager)
- zbar shared library (required by pyzbar for QR code decoding)
- libmagic (required by python-magic for MIME detection)

### System Dependencies

**Windows:**
```
pip install python-magic-bin
```
The zbar DLL is bundled with the pyzbar pip package on Windows.

**Ubuntu/Debian:**
```
sudo apt-get install libzbar0 libmagic1
```

**macOS:**
```
brew install zbar libmagic
```

## Setup

1. **Clone the repository:**
```bash
git clone <repository-url>
cd vigilentra
```

2. **Create a virtual environment:**
```bash
python -m venv venv
source venv/bin/activate  # Linux/macOS
venv\Scripts\activate     # Windows
```

3. **Install dependencies:**
```bash
pip install -r backend/requirements.txt
```

4. **Configure environment variables:**
```bash
cp backend/.env.example backend/.env
```
Edit `backend/.env` and fill in your API keys.

5. **Seed the database:**
```bash
python -m backend.seed_data
```

6. **Start the backend server:**
```bash
uvicorn backend.main:app --reload
```

7. **Open the frontend:**
Open `frontend/index.html` directly in your browser, or serve it with any static file server:
```bash
python -m http.server 3000 --directory frontend
```

## API Endpoint Reference

| Method | Endpoint                          | Description                    | Auth Required |
|--------|-----------------------------------|--------------------------------|---------------|
| POST   | `/auth/register`                  | Register a new user            | No            |
| POST   | `/auth/login`                     | Authenticate and get JWT       | No            |
| GET    | `/auth/me`                        | Get current user profile       | Yes           |
| POST   | `/scan/link`                      | Scan a URL                     | Yes           |
| POST   | `/scan/qr`                        | Scan a QR code image           | Yes           |
| POST   | `/scan/document`                  | Scan a document file           | Yes           |
| GET    | `/scan/history`                   | Get user's scan history        | Yes           |
| GET    | `/admin/stats`                    | Get dashboard statistics       | Admin         |
| GET    | `/admin/threats`                  | Get flagged threats            | Admin         |
| GET    | `/admin/users`                    | List all users                 | Admin         |
| GET    | `/admin/alerts`                   | Get system alerts              | Admin         |
| POST   | `/admin/alerts/{id}/acknowledge`  | Acknowledge an alert           | Admin         |

## Demo Credentials

| Role  | Email                     | Password   |
|-------|---------------------------|------------|
| Admin | admin@vigilentra.local    | Admin@123  |
| User  | user1@test.local          | User@123   |
| User  | user2@test.local          | User@123   |
| User  | user3@test.local          | User@123   |

## Getting Free API Keys

### VirusTotal
1. Create a free account at https://www.virustotal.com/gui/join-us
2. Go to your profile and copy the API key
3. Free tier: 4 requests/minute, 500 requests/day

### Google Safe Browsing
1. Go to https://console.cloud.google.com
2. Create a new project (or select existing)
3. Enable the Safe Browsing API from the API Library
4. Create credentials (API Key) under APIs & Services
5. Free tier: 10,000 requests/day

## Project Structure

```
vigilentra/
├── backend/
│   ├── main.py                    # FastAPI app entry point
│   ├── database.py                # SQLAlchemy engine, session, Base
│   ├── config.py                  # Settings from .env (pydantic-settings)
│   ├── models.py                  # ORM models: User, Scan, Alert, CacheEntry
│   ├── schemas.py                 # Pydantic request/response schemas
│   ├── auth.py                    # JWT, password hashing, auth dependencies
│   ├── dependencies.py            # Shared FastAPI dependencies
│   ├── scanners/
│   │   ├── base.py                # ScanResult dataclass
│   │   ├── link_scanner.py        # Heuristic + Safe Browsing + VirusTotal
│   │   ├── qr_scanner.py          # QR decode + payload routing
│   │   ├── doc_scanner.py         # PDF/Office inspection + hash lookup
│   │   └── threat_classifier.py   # Signal-to-category mapping
│   ├── routes/
│   │   ├── auth_routes.py         # /auth/* endpoints
│   │   ├── scan_routes.py         # /scan/* endpoints
│   │   └── admin_routes.py        # /admin/* endpoints
│   ├── utils/
│   │   ├── cache.py               # DB-backed result cache
│   │   └── rate_limit.py          # Per-user rate limiter
│   ├── requirements.txt
│   ├── .env.example
│   └── seed_data.py               # Demo data seeder
├── frontend/
│   ├── index.html                 # Login page
│   ├── register.html              # Registration page
│   ├── scan.html                  # Threat scanner page
│   ├── history.html               # Scan history page
│   ├── admin.html                 # Admin dashboard
│   ├── css/
│   │   ├── base.css               # Global styles and tokens
│   │   └── components.css         # Component-level styles
│   ├── js/
│   │   ├── api/                   # API client modules
│   │   ├── components/            # Reusable UI components
│   │   ├── pages/                 # Page orchestrators
│   │   ├── utils/                 # Utilities (auth, format, routing)
│   │   └── main.js                # Entry point
│   └── assets/
│       └── logo.svg               # Placeholder logo
├── README.md
└── .gitignore
```

## Roadmap

- Email alerts for admin when critical threats are detected
- LDAP/SSO integration for institutional authentication
- Network traffic analysis module
- PDF report generation for scan results
- Bulk URL scanning via CSV upload
- Threat intelligence feed aggregation
- Mobile-responsive progressive web app
- Role-based access control with custom permission levels
- Integration with SIEM platforms
- Automated periodic scanning of institutional assets
