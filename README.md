# YT-Sum AI

A full-stack web application that analyzes YouTube videos with a practical AI pipeline:

YouTube Video -> Audio Extraction -> Speech-to-Text -> Transcript Processing -> Summarization -> Translation (optional) -> Text-to-Speech -> Audio Playback

## Features

- Multi-page web app with dedicated views for:
  - Home
  - Processing status
  - Transcript viewer (search + download)
  - Summarization
  - Translation
  - Audio summary playback (+ download)
  - Analytics
  - History
  - Model settings
- Transcript generation from YouTube captions with Whisper fallback (if installed)
- Transcript preprocessing for cleanup/noise reduction
- Extractive and abstractive summarization modes
- Optional translation (Tamil, Hindi, French) with transformer or offline fallback
- Text-to-speech output and in-browser audio playback
- Analytics: duration, transcript size, summary size, compression ratio
- Intelligent helpers:
  - keyword extraction
  - topic detection
  - timestamp highlights
  - transcript QA

## Tech Stack

- Backend: FastAPI + SQLModel (SQLite)
- Frontend: Multi-page HTML/CSS/JS served by FastAPI
- NLP/AI tooling: sumy, transformers (optional), gTTS, youtube-transcript-api, yt-dlp

## Project Structure

app/
- main.py
- database.py
- models.py
- schemas.py
- api/routes.py
- services/

frontend/
- pages/
- assets/css/
- assets/js/

data/
audio_outputs/

## Setup

1. Create environment and install dependencies:

	python3 -m venv .venv
	source .venv/bin/activate
	pip install -r requirements.txt

2. Configure environment variables:

  cp .env.example .env

  # Edit .env and set your Groq API key
  # GROQ_API_KEY=...

3. Start the app:

  uvicorn app.main:app --reload

4. Open:

	http://127.0.0.1:8000

## Notes

- For audio extraction, ensure yt-dlp is available.
- For duration probing, ffprobe (ffmpeg package) is recommended.
- For ASR fallback when captions are unavailable, install Whisper: pip install openai-whisper
- Transformer models are optional and can be toggled from Model Settings.
- Without transformers, summarization/translation uses deterministic fallbacks.
- If GROQ_API_KEY is set and USE_GROQ=true, summarization, translation, and QA will use Groq first, then automatically fall back to local methods if unavailable.
