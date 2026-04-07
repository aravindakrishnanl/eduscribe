"""
Convenience re-export so the routes can also be imported from
``app.routes.video`` matching the project structure spec.

All endpoints live in ``app.routes.analysis``.
"""

from app.routes.analysis import router  # noqa: F401

__all__ = ["router"]
