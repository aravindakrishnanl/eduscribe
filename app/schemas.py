from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class ProcessRequest(BaseModel):
    video_url: str
    summary_type: str = Field(default="extractive", pattern="^(extractive|abstractive)$")
    summary_length: int = Field(default=4, ge=2, le=12)
    summary_model: str = "sshleifer/distilbart-cnn-12-6"
    translation_language: Optional[str] = None
    tts_language: Optional[str] = None


class ProcessResponse(BaseModel):
    id: int
    video_id: str
    title: str
    transcript: str
    cleaned_transcript: str
    summary: str
    translated_summary: Optional[str]
    tts_audio_url: Optional[str]
    analytics: dict
    keywords: list[str]
    topics: list[str]
    timestamps: list[dict]


class HistoryItem(BaseModel):
    id: int
    video_url: str
    video_id: str
    title: str
    summary_type: str
    summary_length: int
    translation_language: Optional[str]
    created_at: datetime


class QARequest(BaseModel):
    analysis_id: int
    question: str


class SettingsModel(BaseModel):
    asr_model: str = "whisper-small"
    abstractive_model: str = "sshleifer/distilbart-cnn-12-6"
    translation_model: str = "Helsinki-NLP/opus-mt-en-fr"
    enable_transformers: bool = False
