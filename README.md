<div align="center">

# Eduscribe

**Turn any YouTube lecture into structured notes, summaries, and audio — instantly.**

[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=flat&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?style=flat&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-06B6D4?style=flat&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

</div>

---

## Overview

Eduscribe is a full-stack AI-powered application designed for students. Paste a YouTube lecture URL and get back a clean transcript, an AI-generated summary, optional translation, and a spoken audio version — all in one place.

```
YouTube URL → Audio Extraction → Speech-to-Text → Transcript → Summary → Translation → Audio Playback
```

---

## Features

### Core Pipeline
- **Transcript Generation** — pulls YouTube captions directly; falls back to Whisper ASR when unavailable
- **Transcript Preprocessing** — cleans noise, filler words, and formatting artifacts
- **Summarization** — supports both extractive (sumy) and abstractive (transformers / Groq) modes
- **Translation** — Tamil, Hindi, and French via transformer models or offline fallback
- **Text-to-Speech** — generates spoken audio from the summary using gTTS, playable and downloadable in-browser

### Smart Helpers
- Keyword extraction and topic detection
- Timestamp highlights from the transcript
- Transcript Q&A (powered by Groq when available)

### Multi-Page Frontend
| Page | Purpose |
|------|---------|
| Home | Submit YouTube URL |
| Processing | Live status of the pipeline |
| Transcript | Full transcript with search and download |
| Summary | View generated summary |
| Translation | Translated output |
| Audio | Playback and download of spoken summary |
| Analytics | Duration, compression ratio, word counts |
| History | Past sessions |
| Model Settings | Toggle Groq / transformer / fallback modes |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | FastAPI, SQLModel, SQLite |
| Frontend | React 19, TypeScript, Tailwind CSS, Vite |
| AI / NLP | sumy, transformers, gTTS, Groq API |
| Media | yt-dlp, youtube-transcript-api, ffmpeg |
| UI Components | Radix UI, lucide-react, react-router-dom |

---

## Project Structure

```
eduscribe/
├── app/
│   ├── main.py
│   ├── database.py
│   ├── models.py
│   ├── schemas.py
│   ├── api/
│   │   └── routes.py
│   └── services/
├── src/               # React frontend (TypeScript)
├── public/
├── data/
│   └── audio_outputs/
├── requirements.txt
├── package.json
└── vite.config.ts
```

---

## Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- ffmpeg (recommended for audio extraction)

### Backend Setup

```bash
# Clone the repo
git clone https://github.com/aravindakrishnanl/eduscribe.git
cd eduscribe

# Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Add your Groq API key in .env:
# GROQ_API_KEY=your_key_here
# USE_GROQ=true

# Start the backend
uvicorn app.main:app --reload
```

Backend runs at `http://127.0.0.1:8000`

### Frontend Setup

```bash
# Install Node dependencies
npm install

# Start dev server
npm run dev
```

Frontend runs at `http://localhost:5173`

---

## Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `GROQ_API_KEY` | Groq API key for fast cloud inference | *(unset)* |
| `USE_GROQ` | Enable Groq for summarization, translation, QA | `false` |

When `USE_GROQ=true`, the app uses Groq first and gracefully falls back to local models if unavailable. Without any API key, all processing runs fully offline.

---

## Optional Enhancements

| Feature | Requirement |
|---------|------------|
| ASR fallback (no captions) | `pip install openai-whisper` |
| Audio duration probing | Install `ffmpeg` (includes ffprobe) |
| Abstractive summarization | `transformers` + `torch` (already in requirements) |

---

## API Reference

Full API documentation is available in [`API_DOCUMENTATION.md`](./API_DOCUMENTATION.md).

---

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you'd like to change.

```bash
# Create a feature branch
git checkout -b feature/your-feature-name

# Commit your changes
git commit -m "feat: describe your change"

# Push and open a PR
git push origin feature/your-feature-name
```

---
built with ❤️ for students.
