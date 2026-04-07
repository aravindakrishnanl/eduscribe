"""
Database engine, session dependency, and startup initialisation.

Uses SQLModel with the psycopg2 PostgreSQL driver.  A lightweight
connection test is performed at startup so that configuration errors
surface immediately with a clear message rather than on the first
API request.
"""

from collections.abc import Generator

from sqlmodel import Session, SQLModel, create_engine, text

from app.config import DATABASE_URL

# ── Engine ───────────────────────────────────────────────────────────
engine = create_engine(
    DATABASE_URL,
    echo=False,
    # pool_pre_ping sends a SELECT 1 before reusing a connection
    pool_pre_ping=True,
    # Supabase pooler (PgBouncer) works best with small pools
    pool_size=5,
    max_overflow=10,
    pool_timeout=30,
    pool_recycle=300,  # recycle connections every 5 min
    connect_args={
        "connect_timeout": 15,
        # required for Supabase transaction-mode pooling
        "options": "-c search_path=public",
    },
)


# ── Connection test ──────────────────────────────────────────────────
def _test_connection() -> None:
    """Execute a trivial query to verify that the database is reachable."""
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            result.close()
        print("[OK] Database connection verified.")
    except Exception as exc:
        msg = str(exc)
        hints = [
            "• Verify DATABASE_URL in .env is correct",
            "• Use the Supabase Session pooler URL (port 6543), not direct (5432)",
            "• Username must be  postgres.<project-ref>  (note the dot)",
            "• Password with special chars must be URL-encoded",
            "• Check that your Supabase project is active (not paused)",
        ]
        if "Tenant or user not found" in msg:
            hints.insert(
                0,
                "▸ 'Tenant or user not found' usually means the project-ref "
                "in the username is wrong or the password is not correctly "
                "URL-encoded.",
            )
        print(
            f"\n[ERROR] Failed to connect to database:\n  {exc}\n\nHints:\n"
            + "\n".join(f"  {h}" for h in hints)
            + "\n"
        )
        raise SystemExit(1) from exc


# ── Table creation ───────────────────────────────────────────────────
def init_db() -> None:
    """
    Test the connection and then create any tables that don't exist.

    Called once during FastAPI lifespan startup.
    """
    # Import all models so SQLModel.metadata knows about them
    from app.models import VideoAnalysis  # noqa: F401

    _test_connection()

    try:
        SQLModel.metadata.create_all(engine)
        print("[OK] Database tables verified / created successfully.")
    except Exception as exc:
        print(f"\n[ERROR] Failed to create tables:\n  {exc}\n")
        raise SystemExit(1) from exc


# ── FastAPI dependency ───────────────────────────────────────────────
def get_session() -> Generator[Session, None, None]:
    """Yield a SQLModel session for use as a FastAPI dependency."""
    with Session(engine) as session:
        yield session
