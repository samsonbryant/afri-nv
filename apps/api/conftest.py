"""Root conftest — must run before Django settings import."""

from __future__ import annotations

import os

os.environ["DJANGO_ENV"] = "test"
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
