"""
Application configuration.

Loads environment variables and validates/normalises the Supabase
DATABASE_URL so common mistakes are caught before the first query.
"""

import os
import re
import sys
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
AUDIO_DIR = BASE_DIR / "audio_outputs"

# ── Database ─────────────────────────────────────────────────────────


def _mask_password(url: str) -> str:
    """Return a copy of *url* with the password replaced by '***'."""
    return re.sub(r"(://[^:]+:)[^@]+(@)", r"\1***\2", url)


def _validate_and_fix_database_url(raw_url: str) -> str:
    """
    Apply lightweight string-level fixes for common Supabase mistakes.

    We intentionally avoid parsing + rebuilding the URL (which causes
    double-encoding of percent-encoded passwords).  Instead we apply
    targeted regex replacements.
    """
    url = raw_url.strip()

    # Fix 1: postgres:// → postgresql://  (psycopg2 requires the full form)
    if url.startswith("postgres://"):
        url = "postgresql://" + url[len("postgres://"):]
        print("[AUTO-FIX] Replaced scheme 'postgres://' → 'postgresql://'")

    # Fix 2: wrong port for pooler host
    if "pooler.supabase.com" in url:
        url = re.sub(
            r"(pooler\.supabase\.com):5432",
            r"\1:6543",
            url,
        )
        if ":5432" not in raw_url and ":6543" not in raw_url:
            # No port specified at all — inject 6543
            url = re.sub(
                r"(pooler\.supabase\.com)(/)",
                r"\1:6543\2",
                url,
            )

    # Validate: username should look like postgres.<project-ref>
    username_match = re.match(r"postgresql://([^:]+):", url)
    if username_match:
        username = username_match.group(1)
        if "pooler.supabase.com" in url and "." not in username:
            print(
                "[WARNING] Username does not contain a project-ref.\n"
                "  Expected format: postgres.<project-ref>\n"
                f"  Got: {username}"
            )

    # Validate: host should not be the direct DB host
    direct_match = re.search(r"@db\.([a-z]+)\.supabase\.co", url)
    if direct_match:
        print(
            f"[WARNING] You are using the direct DB host "
            f"(db.{direct_match.group(1)}.supabase.co).\n"
            "  This often fails with 'Network is unreachable'.\n"
            "  Use the pooler host instead:\n"
            "    aws-0-<region>.pooler.supabase.com:6543"
        )

    print(f"[DB] Using: {_mask_password(url)}")
    return url


_raw = os.getenv("DATABASE_URL", "").strip()

if not _raw:
    print(
        "\n[ERROR] DATABASE_URL is not set.\n"
        "Please add it to your .env file:\n\n"
        "  DATABASE_URL=postgresql://postgres.<project-ref>:<password>@"
        "aws-0-<region>.pooler.supabase.com:6543/postgres\n\n"
        "You can find this in your Supabase project → Settings → Database "
        "→ Connection string (URI).\n"
    )
    sys.exit(1)

DATABASE_URL = _validate_and_fix_database_url(_raw)

# ── Groq LLM ─────────────────────────────────────────────────────────
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "").strip()
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile").strip()
USE_GROQ = os.getenv("USE_GROQ", "true").strip().lower() in {"1", "true", "yes", "on"}

DATA_DIR.mkdir(parents=True, exist_ok=True)
AUDIO_DIR.mkdir(parents=True, exist_ok=True)
