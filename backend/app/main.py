"""FastAPI application main entry point."""
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from app.config import settings
from app.database.influx_client import influx_service
from app.routes import (
    venue,
    access_points,
    cause_codes,
    anomalies,
    clients,
    hosts,
    os_distribution,
    load,
    time_series
)

# Create FastAPI app
app = FastAPI(
    title=settings.api_title,
    version=settings.api_version,
    description="FastAPI backend for Ruckus Dashboard",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(venue.router, prefix=settings.api_prefix)
app.include_router(access_points.router, prefix=settings.api_prefix)
app.include_router(cause_codes.router, prefix=settings.api_prefix)
app.include_router(anomalies.router, prefix=settings.api_prefix)
app.include_router(clients.router, prefix=settings.api_prefix)
app.include_router(hosts.router, prefix=settings.api_prefix)
app.include_router(os_distribution.router, prefix=settings.api_prefix)
app.include_router(load.router, prefix=settings.api_prefix)
app.include_router(time_series.router, prefix=settings.api_prefix)


@app.on_event("startup")
async def startup_event():
    """Initialize services on startup."""
    influx_service.connect()
    health = influx_service.get_health()
    if not health:
        print("Warning: InfluxDB connection health check failed")


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown."""
    influx_service.close()


@app.get("/", tags=["health"])
async def root():
    """Root endpoint."""
    return {
        "message": "Ruckus Dashboard API",
        "version": settings.api_version,
        "docs": "/docs"
    }


@app.get("/health", tags=["health"])
async def health_check():
    """Health check endpoint."""
    db_health = influx_service.get_health()
    return {
        "status": "healthy" if db_health else "degraded",
        "database": "connected" if db_health else "disconnected"
    }


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle validation errors."""
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Invalid request parameters",
                "details": exc.errors()
            }
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle general exceptions."""
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An internal server error occurred",
                "details": {}
            }
        }
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3001)


