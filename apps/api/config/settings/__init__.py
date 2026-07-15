"""Django settings loader.

Loads development, production, or test settings based on ``DJANGO_ENV``.
"""

from __future__ import annotations

import os

_env = os.environ.get("DJANGO_ENV", "development").lower()

if _env == "production":
    from .production import *  # noqa: F403
elif _env == "test":
    from .test import *  # noqa: F403
else:
    from .development import *  # noqa: F403
