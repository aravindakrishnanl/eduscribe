from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from app.config import AUDIO_DIR
from app.database import init_db
from app.routes.analysis import router as analysis_router
from app.routes.settings import router as settings_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: create DB tables. Shutdown: nothing special needed."""
    init_db()
    yield


app = FastAPI(
    title="YT-Sum API",
    description="Backend REST API for YouTube video transcript analysis, summarization, translation, and TTS.",
    version="2.0.0",
    lifespan=lifespan,
)

# Serve TTS audio files
app.mount("/audio", StaticFiles(directory=str(AUDIO_DIR)), name="audio")

# Register routers
app.include_router(analysis_router)
app.include_router(settings_router)


@app.get("/health")
def health_check() -> dict:
    """Simple health-check endpoint."""
    return {"status": "ok"}
