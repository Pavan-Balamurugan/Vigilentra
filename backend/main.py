"""FastAPI application entry point for the Vigilentra threat detection system."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.config import settings
from backend.database import init_db
from backend.routes.auth_routes import router as auth_router
from backend.routes.scan_routes import router as scan_router
from backend.routes.admin_routes import router as admin_router

app = FastAPI(
    title="Vigilentra",
    description="Multi-format cyber threat detection system for educational institutions, hostels, and small businesses.",
    version="1.0.0",
)

# CORS configuration -- permissive for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register route modules
app.include_router(auth_router)
app.include_router(scan_router)
app.include_router(admin_router)


@app.on_event("startup")
def on_startup() -> None:
    """Initialize the database tables on application startup."""
    init_db()


@app.get("/")
def root() -> dict:
    """Health check endpoint.

    Returns:
        Service name and version.
    """
    return {"service": "Vigilentra", "version": "1.0.0", "status": "running"}
