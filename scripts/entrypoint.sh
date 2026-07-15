#!/usr/bin/env bash
# Generic API container entrypoint
set -euo pipefail

echo "Waiting for database..."
python <<'PY'
import os
import sys
import time
from urllib.parse import urlparse

import psycopg

url = os.environ.get("DATABASE_URL", "")
if not url:
    print("No DATABASE_URL set; skipping DB wait")
    sys.exit(0)

parsed = urlparse(url)
for attempt in range(30):
    try:
        conn = psycopg.connect(
            dbname=(parsed.path or "/novixa").lstrip("/") or "novixa",
            user=parsed.username or "novixa",
            password=parsed.password or "",
            host=parsed.hostname or "localhost",
            port=parsed.port or 5432,
        )
        conn.close()
        print("Database is ready")
        break
    except Exception as exc:  # noqa: BLE001
        print(f"DB not ready ({attempt + 1}/30): {exc}")
        time.sleep(2)
else:
    print("Database connection failed", file=sys.stderr)
    sys.exit(1)
PY

if [[ "${RUN_MIGRATIONS:-True}" == "True" ]]; then
  python manage.py migrate --noinput
fi

if [[ "${RUN_COLLECTSTATIC:-False}" == "True" ]]; then
  python manage.py collectstatic --noinput
fi

exec "$@"
