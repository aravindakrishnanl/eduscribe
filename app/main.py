from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from app.api.routes import router as api_router
from app.database import init_db

app = FastAPI(title="YT-Sum AI", version="1.0.0")

BASE_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIR = BASE_DIR / "frontend"
PAGES_DIR = FRONTEND_DIR / "pages"

app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIR / "assets")), name="assets")
app.mount("/audio", StaticFiles(directory=str(BASE_DIR / "audio_outputs")), name="audio")

templates = Jinja2Templates(directory=str(PAGES_DIR))


@app.on_event("startup")
def on_startup() -> None:
    init_db()


app.include_router(api_router)


@app.get("/", response_class=HTMLResponse)
def home(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


@app.get("/processing", response_class=HTMLResponse)
def processing(request: Request):
    return templates.TemplateResponse("processing.html", {"request": request})


@app.get("/transcript", response_class=HTMLResponse)
def transcript(request: Request):
    return templates.TemplateResponse("transcript.html", {"request": request})


@app.get("/summary", response_class=HTMLResponse)
def summary(request: Request):
    return templates.TemplateResponse("summary.html", {"request": request})


@app.get("/translation", response_class=HTMLResponse)
def translation(request: Request):
    return templates.TemplateResponse("translation.html", {"request": request})


@app.get("/audio-summary", response_class=HTMLResponse)
def audio_summary(request: Request):
    return templates.TemplateResponse("audio_summary.html", {"request": request})


@app.get("/analytics", response_class=HTMLResponse)
def analytics(request: Request):
    return templates.TemplateResponse("analytics.html", {"request": request})


@app.get("/history", response_class=HTMLResponse)
def history(request: Request):
    return templates.TemplateResponse("history.html", {"request": request})


@app.get("/settings", response_class=HTMLResponse)
def settings(request: Request):
    return templates.TemplateResponse("settings.html", {"request": request})
