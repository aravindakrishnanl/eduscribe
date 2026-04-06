from sqlmodel import SQLModel, create_engine

from app.config import DB_PATH

sqlite_url = f"sqlite:///{DB_PATH}"
engine = create_engine(sqlite_url, echo=False)


def init_db() -> None:
    from app.models import VideoAnalysis

    SQLModel.metadata.create_all(engine)
