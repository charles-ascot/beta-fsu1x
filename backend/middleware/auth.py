"""
FSU API key middleware.

Validates X-API-Key on every request except:
  - /health
  - /docs  /redoc  /openapi.json
  - /v1/keys  (those use X-Admin-Key validated inside the router)
"""

from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from services.key_service import is_valid_key

EXEMPT_PATHS = {
    "/health",
    "/docs",
    "/redoc",
    "/openapi.json",
    "/v1/keys",
}


class APIKeyMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        path = request.url.path

        # Strip trailing slash for matching
        clean_path = path.rstrip("/") or "/"

        # Let CORS preflight pass through untouched
        if request.method == "OPTIONS":
            return await call_next(request)

        # Exempt paths pass straight through
        if clean_path in EXEMPT_PATHS or clean_path.startswith("/v1/keys"):
            return await call_next(request)

        api_key = request.headers.get("X-API-Key")

        if not api_key:
            return JSONResponse(
                status_code=401,
                content={"detail": "Missing X-API-Key header"},
            )

        valid = await is_valid_key(api_key)

        if not valid:
            return JSONResponse(
                status_code=403,
                content={"detail": "Invalid or revoked API key"},
            )

        return await call_next(request)
