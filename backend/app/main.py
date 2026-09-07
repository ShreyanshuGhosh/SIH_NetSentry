from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import audit, training, dashboard, exemplars, reports, rules, live_pull

app = FastAPI(
    title="NetSentry AI Compliance Auditor Backend",
    version="1.1.0",
    description="SIH26155 (NTRO, Government of India) - AI-Driven Multi-Vendor Network Compliance Auditor"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(audit.router)
app.include_router(training.router)
app.include_router(dashboard.router)
app.include_router(exemplars.router)
app.include_router(reports.router)
app.include_router(rules.router)
app.include_router(live_pull.router)

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "engine": "NetSentry Dual-Lane Core v1.1.0",
        "problem_statement": "SIH26155",
        "organization": "NTRO, Government of India"
    }
