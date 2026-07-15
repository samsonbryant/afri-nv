# =============================================================================
# Novixa API — multi-stage Dockerfile (development + production)
# =============================================================================

ARG PYTHON_VERSION=3.12

# -----------------------------------------------------------------------------
# Base
# -----------------------------------------------------------------------------
FROM python:${PYTHON_VERSION}-slim-bookworm AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    DJANGO_SETTINGS_MODULE=config.settings

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        curl \
        libpq5 \
        build-essential \
        libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements/ /app/requirements/

# -----------------------------------------------------------------------------
# Development
# -----------------------------------------------------------------------------
FROM base AS development

RUN pip install --upgrade pip \
    && pip install -r /app/requirements/development.txt

COPY . /app/

RUN chmod +x /app/scripts/entrypoint.sh || true

EXPOSE 8000

ENTRYPOINT ["/app/scripts/entrypoint.sh"]
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]

# -----------------------------------------------------------------------------
# Production builder
# -----------------------------------------------------------------------------
FROM base AS builder

RUN pip install --upgrade pip \
    && pip install -r /app/requirements/production.txt

COPY . /app/

RUN python manage.py collectstatic --noinput 2>/dev/null || true

# -----------------------------------------------------------------------------
# Production
# -----------------------------------------------------------------------------
FROM python:${PYTHON_VERSION}-slim-bookworm AS production

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DJANGO_SETTINGS_MODULE=config.settings \
    DJANGO_ENV=production

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        curl \
        libpq5 \
    && rm -rf /var/lib/apt/lists/* \
    && useradd --create-home --shell /bin/bash novixa

COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin
COPY --chown=novixa:novixa . /app/

RUN chmod +x /app/scripts/entrypoint.sh

USER novixa

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8000/api/v1/health/ || exit 1

ENV RUN_COLLECTSTATIC=True
ENTRYPOINT ["/app/scripts/entrypoint.sh"]
CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "2", "--timeout", "120"]
