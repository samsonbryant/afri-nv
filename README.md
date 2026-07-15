# Novixa

**AI Business Operating System** — automate repetitive work with Artificial Intelligence.

Novixa is a production-ready SaaS platform that helps businesses design workflows, run automations, and use AI (including vector search via pgvector) to reduce manual operations.

## Architecture

```
novixa/
├── apps/
│   ├── web/          # Next.js 15 · React 19 · TypeScript · Tailwind · shadcn/ui
│   └── api/          # Django 5 · DRF · Celery · Clean Architecture
├── docker/           # PostgreSQL, Redis, Nginx configs
├── .github/workflows # CI + Render deploy hooks
├── docker-compose.yml
├── Makefile
└── render.yaml
```

### Design principles

| Principle | Application |
|-----------|-------------|
| Feature-based architecture | Frontend features under `apps/web/src/features/*` |
| Clean Architecture | Backend layers: `domain` → `application` → `infrastructure` → `interfaces` |
| SOLID | Thin views, injectable services, repository interfaces |
| Repository pattern | Abstract ports in `domain/`, Django adapters in `infrastructure/` |
| Service layer | Use cases in `application/services.py` |
| Dependency injection | Factories in `infrastructure/dependencies.py` |

### Tech stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion, TanStack Query, React Hook Form, Zustand |
| Backend | Python 3.12, Django 5.1, Django REST Framework, SimpleJWT |
| Database | PostgreSQL 16 + pgvector |
| Cache / broker | Redis 7 |
| Jobs | Celery + django-celery-beat |
| Deploy | Docker, Render |
| Quality | ESLint, Prettier, Husky, Commitlint, Ruff, Mypy, Vitest, Pytest, GitHub Actions |

## Quick start

### Prerequisites

- Docker & Docker Compose
- Node.js 20+
- Python 3.12+ (for local API without Docker)
- Make (optional)

### One-command setup (Docker)

```bash
cp .env.example .env
make setup
```

This installs dependencies, starts PostgreSQL, Redis, API, Celery, and the web app, then runs migrations.

| Service | URL |
|---------|-----|
| Web | http://localhost:3000 |
| API | http://localhost:8000 |
| OpenAPI docs | http://localhost:8000/api/docs/ |
| Health | http://localhost:8000/api/v1/health/ |

### Local development (hybrid)

```bash
# Infrastructure only
docker compose up -d postgres redis

# Backend
cd apps/api
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements/development.txt
python manage.py migrate
python manage.py runserver

# Celery (separate terminals)
celery -A config worker -l info
celery -A config beat -l info --scheduler django_celery_beat.schedulers:DatabaseScheduler

# Frontend (repo root)
npm install
npm run dev
```

### Create a superuser

```bash
make createsuperuser
# or
cd apps/api && source .venv/bin/activate && python manage.py createsuperuser
```

## Makefile targets

```bash
make help          # List all targets
make install       # Install web + API deps
make up / down     # Docker Compose start/stop
make migrate       # Django migrations
make lint          # ESLint + Ruff
make format        # Prettier + Ruff format
make test          # Vitest + Pytest
make typecheck     # tsc + mypy
make ci            # lint + typecheck + test
make reset         # Tear down volumes + caches
```

## API overview (`/api/v1`)

| Area | Endpoints |
|------|-----------|
| Health | `GET /health/` |
| Auth | `POST /auth/register/`, `POST /auth/login/`, `POST /auth/refresh/`, `GET /auth/me/` |
| Organizations | CRUD + memberships |
| Workflows | CRUD |
| Automations | list, trigger, detail |
| AI / Documents | CRUD + semantic search |

Interactive schema: `/api/schema/` · Swagger UI: `/api/docs/`

## Frontend structure

```
apps/web/src/
├── app/                 # Next.js App Router (auth + dashboard route groups)
├── features/            # auth, dashboard, workflows, automations, settings, organizations
├── components/
│   ├── ui/              # shadcn primitives
│   ├── layout/          # sidebar, topbar, mobile nav
│   ├── providers/       # theme, query, app providers
│   └── shared/          # logo, theme toggle, empty states
├── lib/api/             # typed fetch client, endpoints, errors
├── stores/              # Zustand UI state
└── hooks/
```

- Light / dark mode via `next-themes`
- WCAG-minded focus states, labels, and semantics
- Framer Motion on the marketing landing
- JWT handled by the API client + auth store

## Backend structure

```
apps/api/
├── config/              # settings, URLs, Celery, ASGI/WSGI
├── apps/
│   ├── accounts/
│   ├── organizations/
│   ├── workflows/
│   ├── automations/
│   ├── ai_engine/       # embeddings + pgvector documents
│   └── core/            # base models, health, exceptions
└── infrastructure/      # cache, vector, celery tasks, persistence
```

Each domain app follows:

```
domain/          # entities, repository interfaces, exceptions
application/     # services (use cases), DTOs
infrastructure/  # ORM models, repository impl, DI
interfaces/      # DRF views, serializers, URLs
```

## Environment variables

Copy `.env.example` → `.env`. Important keys:

| Variable | Purpose |
|----------|---------|
| `SECRET_KEY` | Django secret |
| `DATABASE_URL` | PostgreSQL connection |
| `REDIS_URL` / `CELERY_*` | Cache and job broker |
| `NEXT_PUBLIC_API_URL` | Frontend → API base URL |
| `OPENAI_API_KEY` | Optional embeddings / LLM |

See `.env.example` for the full list.

## Docker

```bash
# Development stack
docker compose up --build

# Production-oriented stack
docker compose -f docker-compose.prod.yml up --build
```

Images are multi-stage (`development` / `production`) for both `apps/api` and `apps/web`.

## Deployment

| Piece | Host |
|-------|------|
| API + Celery + Postgres + Redis | **Render** (`render.yaml`) |
| Next.js | **Vercel** (`apps/web`) |

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md). Wire secrets in Render/Vercel dashboards; deploy hooks are in `.github/workflows/deploy.yml`.

## Quality gates

| Tool | Scope |
|------|--------|
| ESLint + Prettier | Frontend |
| Husky + lint-staged | Pre-commit |
| Commitlint | Conventional commits |
| Ruff + Mypy | Backend |
| Vitest / Playwright | Frontend unit / e2e |
| Pytest | Backend |
| GitHub Actions | CI on `main` / `develop` |

Conventional commit types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.

## Testing

```bash
# Frontend
npm run test
npm run test:e2e -w apps/web

# Backend
cd apps/api && source .venv/bin/activate && pytest
```

## License

Proprietary — UNLICENSED. All rights reserved.
# afri-nv
