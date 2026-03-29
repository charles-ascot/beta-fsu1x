"""
Chimera FSU-1X — The Odds API
FastAPI backend. Wraps The Odds API with its own auth layer,
Firestore caching, and a built-in API key generator.

All consumer requests require:  X-API-Key: <fsu_key>
All admin requests require:     X-Admin-Key: <admin_key>
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from config import settings
from middleware.auth import APIKeyMiddleware
from routers import sports, odds, events, scores, keys


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown hooks."""
    print(f"FSU-1X starting — project: {settings.gcp_project}")
    yield
    print("FSU-1X shutting down")


app = FastAPI(
    title="Chimera FSU-1X — The Odds API",
    description=(
        "Fractional Service Unit wrapping The Odds API. "
        "Provides normalised odds data across 70+ sports and 40+ bookmakers. "
        "All endpoints require a valid X-API-Key except /health and /docs."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — tightened in production via ALLOWED_ORIGINS env var
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# FSU API key auth — applied to all routes except those in the exemption list
app.add_middleware(APIKeyMiddleware)

# Routers
app.include_router(sports.router,  prefix="/v1", tags=["Sports"])
app.include_router(odds.router,    prefix="/v1", tags=["Odds"])
app.include_router(events.router,  prefix="/v1", tags=["Events"])
app.include_router(scores.router,  prefix="/v1", tags=["Scores"])
app.include_router(keys.router,    prefix="/v1", tags=["API Keys"])


@app.get("/health", tags=["System"])
async def health():
    """Health check — no auth required. Used by Cloud Run."""
    return {"status": "ok", "service": "fsu-1x-odds-api", "version": "1.0.0"}
