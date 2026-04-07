from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.database import get_session
from app.models import VideoAnalysis
from app.schemas import HistoryItem, ProcessRequest, ProcessResponse, QARequest
from app.services.nlp_tasks import (
    answer_question,
    compression_ratio,
    detect_topics,
    extract_keywords,
    summarize,
    text_to_speech,
    translate_text,
)
from app.services.settings_store import load_settings
from app.services.youtube_pipeline import (
    detect_language_code,
    extract_audio,
    extract_video_id,
    fetch_transcript,
    fetch_transcript_with_ytdlp,
    get_video_duration_seconds,
    get_video_title,
    preprocess_transcript,
    transcribe_audio_whisper,
)

router = APIRouter(tags=["analysis"])


# ── POST /analyze ────────────────────────────────────────────────────
@router.post("/analyze", response_model=ProcessResponse)
def analyze_video(
    payload: ProcessRequest,
    session: Session = Depends(get_session),
) -> ProcessResponse:
    """Process a YouTube video: extract transcript, summarize, translate, TTS."""
    settings = load_settings()

    try:
        video_id = extract_video_id(payload.video_url)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    title = get_video_title(payload.video_url, video_id)
    audio_path = extract_audio(payload.video_url, video_id)

    transcript = ""
    timestamps: list[dict] = []
    transcript_errors: list[str] = []

    # Strategy 1: YouTube Transcript API (fastest, uses official captions)
    try:
        transcript, timestamps = fetch_transcript(video_id)
    except Exception as exc:
        transcript_errors.append(f"youtube_transcript_api: {exc}")

    # Strategy 2: yt-dlp auto-generated subtitles
    if not transcript:
        try:
            transcript, timestamps = fetch_transcript_with_ytdlp(
                payload.video_url, video_id
            )
        except Exception as ytdlp_exc:
            transcript_errors.append(f"yt_dlp_auto_subs: {ytdlp_exc}")

    # Strategy 3: Whisper ASR on extracted audio (slowest)
    if not transcript:
        if audio_path:
            transcript = transcribe_audio_whisper(audio_path, model_name="small")
            if not transcript:
                transcript_errors.append(
                    "whisper_asr: whisper model unavailable or transcription failed"
                )
        else:
            transcript_errors.append(
                "audio_extraction: unable to extract audio with yt-dlp"
            )

    if not transcript:
        raise HTTPException(
            status_code=422,
            detail={
                "message": "Unable to build transcript from captions or local Whisper ASR",
                "hints": [
                    "Ensure yt-dlp and ffmpeg are installed and reachable in PATH",
                    "Install Python dependencies from requirements.txt",
                    "Install openai-whisper for ASR fallback: pip install openai-whisper",
                ],
                "errors": transcript_errors,
            },
        )

    cleaned = preprocess_transcript(transcript)
    summary_text = summarize(
        cleaned,
        payload.summary_type,
        payload.summary_length,
        payload.summary_model,
        settings.enable_transformers,
    )

    target_lang = payload.translation_language
    translated = None
    if target_lang:
        translated = translate_text(
            summary_text,
            target_lang,
            settings.translation_model,
            settings.enable_transformers,
        )

    tts_lang = (
        payload.tts_language or target_lang or detect_language_code(summary_text)
    )
    tts_source = translated or summary_text
    audio_summary_path = text_to_speech(tts_source, tts_lang, video_id)

    transcript_words = len(cleaned.split())
    summary_words = len(summary_text.split())
    duration = get_video_duration_seconds(audio_path)
    ratio = compression_ratio(cleaned, summary_text)

    keywords = extract_keywords(cleaned)
    topics = detect_topics(cleaned)

    record = VideoAnalysis(
        video_url=payload.video_url,
        video_id=video_id,
        video_title=title,
        transcript_text=cleaned,
        summary_text=summary_text,
        summary_type=payload.summary_type,
        summary_length=payload.summary_length,
        translated_text=translated,
        translation_language=target_lang,
        tts_audio_path=audio_summary_path,
        duration_seconds=duration,
        transcript_words=transcript_words,
        summary_words=summary_words,
        compression_ratio=ratio,
        keywords=", ".join(keywords),
        topics=", ".join(topics),
    )
    session.add(record)
    session.commit()
    session.refresh(record)

    return ProcessResponse(
        id=record.id,
        video_id=record.video_id,
        title=record.video_title,
        transcript=transcript,
        cleaned_transcript=cleaned,
        summary=summary_text,
        translated_summary=translated,
        tts_audio_url=(
            f"/audio/{Path(audio_summary_path).name}" if audio_summary_path else None
        ),
        analytics={
            "duration_seconds": duration,
            "transcript_words": transcript_words,
            "summary_words": summary_words,
            "compression_ratio": ratio,
        },
        keywords=keywords,
        topics=topics,
        timestamps=timestamps[:20],
    )


# ── GET /video/{video_id} ───────────────────────────────────────────
@router.get("/video/{video_id}")
def get_video_by_id(
    video_id: str,
    session: Session = Depends(get_session),
) -> dict:
    """Retrieve the most recent analysis for a YouTube video ID."""
    statement = (
        select(VideoAnalysis)
        .where(VideoAnalysis.video_id == video_id)
        .order_by(VideoAnalysis.created_at.desc())
    )
    row = session.exec(statement).first()
    if not row:
        raise HTTPException(
            status_code=404, detail=f"No analysis found for video_id '{video_id}'"
        )
    return _row_to_dict(row)


# ── GET /all ─────────────────────────────────────────────────────────
@router.get("/all", response_model=list[HistoryItem])
def list_all_analyses(
    session: Session = Depends(get_session),
) -> list[HistoryItem]:
    """List all stored video analyses (summary view)."""
    rows = session.exec(
        select(VideoAnalysis).order_by(VideoAnalysis.created_at.desc())
    ).all()
    return [
        HistoryItem(
            id=row.id,
            video_url=row.video_url,
            video_id=row.video_id,
            title=row.video_title,
            summary_type=row.summary_type,
            summary_length=row.summary_length,
            translation_language=row.translation_language,
            created_at=row.created_at,
        )
        for row in rows
    ]


# ── GET /history/{analysis_id} ──────────────────────────────────────
@router.get("/history/{analysis_id}")
def get_history_item(
    analysis_id: int,
    session: Session = Depends(get_session),
) -> dict:
    """Get full analysis details by database ID."""
    row = session.get(VideoAnalysis, analysis_id)
    if not row:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return _row_to_dict(row)


# ── POST /qa ─────────────────────────────────────────────────────────
@router.post("/qa")
def ask_question_endpoint(
    payload: QARequest,
    session: Session = Depends(get_session),
) -> dict:
    """Ask a question about a stored transcript."""
    row = session.get(VideoAnalysis, payload.analysis_id)
    if not row:
        raise HTTPException(status_code=404, detail="Analysis not found")
    answer = answer_question(row.transcript_text, payload.question)
    return {"answer": answer}


# ── helper ───────────────────────────────────────────────────────────
def _row_to_dict(row: VideoAnalysis) -> dict:
    """Serialize a VideoAnalysis row to a JSON-friendly dict."""
    return {
        "id": row.id,
        "video_url": row.video_url,
        "video_id": row.video_id,
        "title": row.video_title,
        "transcript": row.transcript_text,
        "summary": row.summary_text,
        "translated_summary": row.translated_text,
        "translation_language": row.translation_language,
        "tts_audio_url": (
            f"/audio/{Path(row.tts_audio_path).name}" if row.tts_audio_path else None
        ),
        "analytics": {
            "duration_seconds": row.duration_seconds,
            "transcript_words": row.transcript_words,
            "summary_words": row.summary_words,
            "compression_ratio": row.compression_ratio,
        },
        "keywords": [k.strip() for k in row.keywords.split(",") if k.strip()],
        "topics": [t.strip() for t in row.topics.split(",") if t.strip()],
        "created_at": row.created_at.isoformat(),
    }
