import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.session import engine, Base
from app.api.endpoints import auth, incidents, approvals, audit, metrics, agents

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend command center for multi-agent incident responses orchestrated by UiPath Maestro",
    version="1.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# CORS configuration
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "*"  # Allow all for development flexibility
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["Authentication"])
app.include_router(incidents.router, prefix=f"{settings.API_V1_STR}/incidents", tags=["Incidents"])
app.include_router(approvals.router, prefix=f"{settings.API_V1_STR}/approvals", tags=["Approvals"])
app.include_router(audit.router, prefix=f"{settings.API_V1_STR}/audit", tags=["Audit Log"])
app.include_router(metrics.router, prefix=f"{settings.API_V1_STR}/metrics", tags=["Metrics"])
app.include_router(agents.router, prefix=f"{settings.API_V1_STR}", tags=["Agents & Chat"])

@app.get("/")
def read_root():
    return {
        "status": "healthy",
        "project": settings.PROJECT_NAME,
        "api_docs": "/docs",
        "simulation_mode": settings.SIMULATION_MODE
    }
