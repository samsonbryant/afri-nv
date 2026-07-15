#!/usr/bin/env bash
# Novixa local setup helper
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "==> Novixa setup"

if [[ ! -f .env ]]; then
  cp .env.example .env
  echo "Created .env from .env.example"
else
  echo ".env already exists"
fi

echo "==> Installing root + web dependencies"
npm install

if command -v python3.12 >/dev/null 2>&1; then
  PYTHON=python3.12
elif command -v python3 >/dev/null 2>&1; then
  PYTHON=python3
else
  echo "Python 3.12+ is required for local API development."
  PYTHON=""
fi

if [[ -n "$PYTHON" ]]; then
  echo "==> Creating API virtualenv with $PYTHON"
  cd apps/api
  "$PYTHON" -m venv .venv
  # shellcheck disable=SC1091
  source .venv/bin/activate
  pip install --upgrade pip
  pip install -r requirements/development.txt
  cd "$ROOT_DIR"
fi

echo "==> Starting Docker services (postgres, redis, api, celery, web)"
docker compose up -d --build

echo "==> Waiting for API health"
for i in {1..30}; do
  if curl -sf http://localhost:8000/api/v1/health/ >/dev/null 2>&1; then
    echo "API is healthy"
    break
  fi
  sleep 2
done

cat <<EOF

Novixa is ready.

  Web:  http://localhost:3000
  API:  http://localhost:8000
  Docs: http://localhost:8000/api/docs/

Create a superuser:
  make createsuperuser

EOF
