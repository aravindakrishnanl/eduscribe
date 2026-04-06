import os
import re
import subprocess
import time
from pathlib import Path
from typing import Optional
from urllib.parse import parse_qs, urlparse

from youtube_transcript_api import YouTubeTranscriptApi

from app.config import DATA_DIR

# Ensure ffmpeg/ffprobe are available in PATH via static_ffmpeg
try:
    import static_ffmpeg
    static_ffmpeg.add_paths()
except ImportError:
    pass  # ffmpeg must already be in PATH

_ytt_api = YouTubeTranscriptApi()


def extract_video_id(url: str) -> str:
    parsed = urlparse(url)

    if "youtu.be" in parsed.netloc:
        return parsed.path.strip("/")

    if "youtube.com" in parsed.netloc:
        query = parse_qs(parsed.query)
        if "v" in query:
            return query["v"][0]

        # Also support shorts URL format.
        match = re.search(r"/shorts/([a-zA-Z0-9_-]+)", parsed.path)
        if match:
            return match.group(1)

    raise ValueError("Unable to extract video id from URL")


def get_video_title(url: str, fallback_video_id: str) -> str:
    try:
        import yt_dlp

        ydl_opts = {
            "quiet": True,
            "skip_download": True,
            "socket_timeout": 30,
            "retries": 10,
        }
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
        return info.get("title") or fallback_video_id
    except Exception:
        return fallback_video_id


def extract_audio(url: str, video_id: str) -> Optional[Path]:
    output_template = str(DATA_DIR / f"{video_id}.%(ext)s")
    
    # yt-dlp options with retry and rate limit handling
    command = [
        "yt-dlp",
        "-f", "bestaudio",
        "-x",
        "--audio-format", "mp3",
        "--socket-timeout", "30",
        "--retries", "10",
        "--fragment-retries", "10",
        "-o", output_template,
        url,
    ]

    max_retries = 3
    for attempt in range(max_retries):
        try:
            result = subprocess.run(command, capture_output=True, text=True, timeout=300)
            if result.returncode == 0:
                candidate = DATA_DIR / f"{video_id}.mp3"
                if candidate.exists():
                    return candidate
                return None
            else:
                error_output = result.stderr + result.stdout
                if "429" in error_output or "Too Many Requests" in error_output:
                    if attempt < max_retries - 1:
                        wait_time = (attempt + 1) * 5
                        print(f"YouTube rate limit hit. Retrying in {wait_time} seconds...")
                        time.sleep(wait_time)
                        continue
                return None
        except subprocess.TimeoutExpired:
            if attempt < max_retries - 1:
                print(f"Timeout. Retrying... (attempt {attempt + 2}/{max_retries})")
                time.sleep(5)
                continue
            return None
        except (subprocess.SubprocessError, FileNotFoundError):
            return None
    
    return None


def fetch_transcript(video_id: str) -> tuple[str, list[dict]]:
    """Fetch transcript from YouTube captions API with retry logic."""
    max_retries = 3
    for attempt in range(max_retries):
        try:
            transcript_list = _ytt_api.fetch(video_id)
            transcript_text = " ".join(
                snippet.text.strip()
                for snippet in transcript_list
            )
            timestamps = [
                {
                    "start": round(snippet.start, 2),
                    "duration": round(snippet.duration, 2),
                    "text": snippet.text,
                }
                for snippet in transcript_list
            ]
            return transcript_text, timestamps
        except Exception as e:
            if attempt < max_retries - 1:
                time.sleep(2 ** attempt)  # Exponential backoff
                continue
            raise


def fetch_transcript_with_ytdlp(url: str, video_id: str) -> tuple[str, list[dict]]:
    """Fallback transcript extraction using auto-generated subtitles via yt-dlp."""
    
    # First, check if the VTT file already exists (cached)
    candidates = sorted(DATA_DIR.glob(f"{video_id}*.vtt"))
    if candidates:
        vtt_path = candidates[0]
        try:
            return _parse_vtt(vtt_path)
        except Exception:
            pass  # If parsing fails, try downloading fresh
    
    # If not cached, download it
    output_template = str(DATA_DIR / f"{video_id}")
    command = [
        "yt-dlp",
        "--skip-download",
        "--write-auto-subs",
        "--sub-langs", "en.*",
        "--sub-format", "vtt",
        "--socket-timeout", "30",
        "--retries", "10",
        "-o", output_template,
        url,
    ]

    max_retries = 3
    for attempt in range(max_retries):
        try:
            result = subprocess.run(command, capture_output=True, text=True, timeout=120)
            if result.returncode == 0:
                candidates = sorted(DATA_DIR.glob(f"{video_id}*.vtt"))
                if candidates:
                    vtt_path = candidates[0]
                    return _parse_vtt(vtt_path)
                raise RuntimeError("No auto subtitle file was generated by yt-dlp")
            else:
                error_output = result.stderr + result.stdout
                if "429" in error_output or "Too Many Requests" in error_output:
                    if attempt < max_retries - 1:
                        wait_time = (attempt + 1) * 5
                        print(f"YouTube rate limit hit. Retrying in {wait_time} seconds...")
                        time.sleep(wait_time)
                        continue
                raise RuntimeError(f"yt-dlp failed: {error_output[:500]}")
        except subprocess.TimeoutExpired:
            if attempt < max_retries - 1:
                print(f"Timeout. Retrying... (attempt {attempt + 2}/{max_retries})")
                time.sleep(5)
                continue
            raise RuntimeError("yt-dlp timeout after multiple retries")

    raise RuntimeError("yt-dlp failed after multiple retries")


def transcribe_audio_whisper(audio_path: Path, model_name: str = "small") -> str:
    try:
        import whisper

        model = whisper.load_model(model_name)
        result = model.transcribe(str(audio_path))
        return result.get("text", "").strip()
    except Exception:
        return ""


def preprocess_transcript(text: str) -> str:
    normalized = re.sub(r"\s+", " ", text).strip()
    normalized = re.sub(r"\[(?:Music|Applause|Laughter)\]", "", normalized, flags=re.I)
    normalized = normalized.replace(" ,", ",").replace(" .", ".")

    # Simple punctuation repair for long transcript lines.
    if not normalized.endswith("."):
        normalized += "."

    return normalized


def detect_language_code(text: str) -> str:
    try:
        from langdetect import detect

        return detect(text)
    except Exception:
        return "en"


def get_video_duration_seconds(audio_path: Optional[Path]) -> int:
    if not audio_path:
        return 0

    command = [
        "ffprobe",
        "-v",
        "error",
        "-show_entries",
        "format=duration",
        "-of",
        "default=noprint_wrappers=1:nokey=1",
        str(audio_path),
    ]

    try:
        result = subprocess.run(command, check=True, capture_output=True, text=True)
        return int(float(result.stdout.strip()))
    except Exception:
        return 0


def _parse_vtt(vtt_path: Path) -> tuple[str, list[dict]]:
    text_lines = []
    timestamps = []
    current_start = 0.0

    for raw_line in vtt_path.read_text(encoding="utf-8", errors="ignore").splitlines():
        line = raw_line.strip()
        if not line or line == "WEBVTT" or line.startswith("NOTE"):
            continue
        # Skip VTT metadata headers (Kind:, Language:, Style:, Region:, etc.)
        if re.match(r"^(Kind|Language|Style|Region):", line, re.I):
            continue
        if "-->" in line:
            current_start = _parse_vtt_time(line.split("-->", maxsplit=1)[0].strip())
            continue
        if line.startswith("<"):
            continue
        # Skip numeric cue identifiers
        if line.isdigit():
            continue

        cleaned = re.sub(r"<[^>]+>", "", line).strip()
        cleaned = re.sub(r"\s+", " ", cleaned)
        if not cleaned:
            continue

        text_lines.append(cleaned)
        timestamps.append({"start": round(current_start, 2), "duration": 0.0, "text": cleaned})

    # De-duplicate consecutive identical lines (common in auto-generated subs)
    deduped_lines = []
    deduped_timestamps = []
    prev = None
    for txt, ts in zip(text_lines, timestamps):
        if txt != prev:
            deduped_lines.append(txt)
            deduped_timestamps.append(ts)
        prev = txt

    transcript = " ".join(deduped_lines).strip()
    if not transcript:
        raise RuntimeError("Parsed subtitle file but transcript was empty")
    return transcript, deduped_timestamps


def _parse_vtt_time(value: str) -> float:
    # Supports HH:MM:SS.mmm and MM:SS.mmm
    parts = value.replace(",", ".").split(":")
    if len(parts) == 3:
        h, m, s = parts
        return float(h) * 3600 + float(m) * 60 + float(s)
    if len(parts) == 2:
        m, s = parts
        return float(m) * 60 + float(s)
    return 0.0
