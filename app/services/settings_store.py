import json
from pathlib import Path

from app.schemas import SettingsModel

SETTINGS_PATH = Path("data/settings.json")


def load_settings() -> SettingsModel:
    if not SETTINGS_PATH.exists():
        settings = SettingsModel()
        save_settings(settings)
        return settings

    payload = json.loads(SETTINGS_PATH.read_text(encoding="utf-8"))
    return SettingsModel(**payload)


def save_settings(settings: SettingsModel) -> None:
    SETTINGS_PATH.parent.mkdir(parents=True, exist_ok=True)
    SETTINGS_PATH.write_text(
        json.dumps(settings.model_dump(), indent=2),
        encoding="utf-8",
    )
