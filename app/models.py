from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel


class VideoAnalysis(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    video_url: str
    video_id: str = Field(index=True)
    video_title: str = "Unknown"
    transcript_text: str
    summary_text: str
    summary_type: str
    summary_length: int
    translated_text: Optional[str] = None
    translation_language: Optional[str] = None
    tts_audio_path: Optional[str] = None
    duration_seconds: int = 0
    transcript_words: int = 0
    summary_words: int = 0
    compression_ratio: float = 0.0
    keywords: str = ""
    topics: str = ""
    created_at: datetime = Field(default_factory=datetime.utcnow)
