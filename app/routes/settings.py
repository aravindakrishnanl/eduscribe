from fastapi import APIRouter

from app.schemas import SettingsModel
from app.services.settings_store import load_settings, save_settings

router = APIRouter(tags=["settings"])


@router.get("/settings", response_model=SettingsModel)
def get_settings() -> SettingsModel:
    """Return current application settings."""
    return load_settings()


@router.put("/settings", response_model=SettingsModel)
def update_settings(settings: SettingsModel) -> SettingsModel:
    """Update application settings."""
    save_settings(settings)
    return settings
