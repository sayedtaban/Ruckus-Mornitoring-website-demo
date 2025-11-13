from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.core.config import get_settings


def create_application() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title=settings.app_name)

    if settings.enable_cors:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=settings.cors_allow_origins,
            allow_credentials=settings.cors_allow_credentials,
            allow_methods=settings.cors_allow_methods,
            allow_headers=settings.cors_allow_headers,
        )

    app.include_router(api_router, prefix=settings.api_prefix)

    return app


app = create_application()

