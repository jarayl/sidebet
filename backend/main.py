import uvicorn

# This will import all models and ensure they are registered with SQLAlchemy
from app.db import base  # noqa

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.api.v1.api import api_router
from app.core.config import settings
from app.db.init_db import init_db
from contextlib import asynccontextmanager
import os

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup event
    init_db()
    yield
    # Shutdown event (if needed)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

# Set up CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API router
app.include_router(api_router, prefix=settings.API_V1_STR)

# Mount static files for profile pictures
uploads_dir = "uploads"
if not os.path.exists(uploads_dir):
    os.makedirs(uploads_dir)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

# Mount static files for public assets (like default profile picture)
public_dir = "public"
if not os.path.exists(public_dir):
    os.makedirs(public_dir)
app.mount("/public", StaticFiles(directory=public_dir), name="public")

@app.get("/")
async def root():
    return {"message": "Welcome to SideBet API"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000) 