import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, engine
from .routes import admin, onboarding, payments


Base.metadata.create_all(bind=engine)

app = FastAPI(title="CampuSync API", version="1.0.0")
frontend_origin = os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/")
configured_origins = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", "").split(",")
    if origin.strip()
]
allowed_origins = list(dict.fromkeys([frontend_origin, *configured_origins]))
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(onboarding.router, prefix="/api")
app.include_router(payments.router, prefix="/api")
app.include_router(admin.router, prefix="/api")


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "campusync-api"}