"""Development settings for Novixa."""

from __future__ import annotations

from .base import *  # noqa: F403
from .base import INSTALLED_APPS, REST_FRAMEWORK

DEBUG = True

INSTALLED_APPS = [*INSTALLED_APPS, "django_extensions"]

REST_FRAMEWORK = {
    **REST_FRAMEWORK,
    "DEFAULT_RENDERER_CLASSES": (
        "rest_framework.renderers.JSONRenderer",
        "rest_framework.renderers.BrowsableAPIRenderer",
    ),
}

EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

# Relaxed security for local development
SECURE_SSL_REDIRECT = False
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False
