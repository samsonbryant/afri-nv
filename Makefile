.PHONY: help install install-web install-api setup env up down build logs \
	migrate makemigrations shell test test-web test-api lint lint-web lint-api \
	format format-check typecheck clean reset \
	celery worker beat docker-up docker-down docker-build docker-logs \
	prod-up prod-down ci

# Default target
help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# -----------------------------------------------------------------------------
# Setup
# -----------------------------------------------------------------------------
env: ## Copy .env.example to .env if missing
	@test -f .env || cp .env.example .env
	@echo ".env ready"

install: env install-web install-api ## Install all dependencies
	@npm install
	@echo "All dependencies installed"

install-web: ## Install frontend dependencies
	@cd apps/web && npm install

install-api: ## Install backend dependencies (venv)
	@cd apps/api && python3 -m venv .venv && \
		. .venv/bin/activate && \
		pip install --upgrade pip && \
		pip install -r requirements/development.txt
	@echo "Backend venv ready at apps/api/.venv"

setup: install docker-up migrate ## Full local setup
	@echo "Novixa is ready. Web: http://localhost:3000  API: http://localhost:8000"

# -----------------------------------------------------------------------------
# Docker
# -----------------------------------------------------------------------------
docker-up: env ## Start all Docker services
	docker compose up -d

docker-down: ## Stop all Docker services
	docker compose down

docker-build: ## Rebuild Docker images
	docker compose build --no-cache

docker-logs: ## Tail Docker logs
	docker compose logs -f

up: docker-up ## Alias for docker-up

down: docker-down ## Alias for docker-down

build: docker-build ## Alias for docker-build

logs: docker-logs ## Alias for docker-logs

prod-up: ## Start production compose stack
	docker compose -f docker-compose.prod.yml up -d --build

prod-down: ## Stop production compose stack
	docker compose -f docker-compose.prod.yml down

# -----------------------------------------------------------------------------
# Database
# -----------------------------------------------------------------------------
migrate: ## Run Django migrations
	@cd apps/api && . .venv/bin/activate && python manage.py migrate

makemigrations: ## Create Django migrations
	@cd apps/api && . .venv/bin/activate && python manage.py makemigrations

shell: ## Open Django shell
	@cd apps/api && . .venv/bin/activate && python manage.py shell_plus || \
		python manage.py shell

createsuperuser: ## Create Django superuser
	@cd apps/api && . .venv/bin/activate && python manage.py createsuperuser

# -----------------------------------------------------------------------------
# Development
# -----------------------------------------------------------------------------
dev-web: ## Start Next.js dev server
	@npm run dev

dev-api: ## Start Django runserver
	@cd apps/api && . .venv/bin/activate && python manage.py runserver 0.0.0.0:8000

worker: ## Start Celery worker
	@cd apps/api && . .venv/bin/activate && celery -A config worker -l info

beat: ## Start Celery beat
	@cd apps/api && . .venv/bin/activate && \
		celery -A config beat -l info --scheduler django_celery_beat.schedulers:DatabaseScheduler

# -----------------------------------------------------------------------------
# Quality
# -----------------------------------------------------------------------------
lint: lint-web lint-api ## Lint frontend and backend

lint-web: ## Lint Next.js app
	@npm run lint

lint-api: ## Lint Django app with Ruff
	@cd apps/api && . .venv/bin/activate && ruff check . && ruff format --check .

format: ## Format all code
	@npm run format
	@cd apps/api && . .venv/bin/activate && ruff format . && ruff check --fix .

format-check: ## Check formatting without writing
	@npm run format:check
	@cd apps/api && . .venv/bin/activate && ruff format --check .

typecheck: ## Typecheck frontend and backend
	@npm run typecheck
	@cd apps/api && . .venv/bin/activate && mypy .

# -----------------------------------------------------------------------------
# Testing
# -----------------------------------------------------------------------------
test: test-web test-api ## Run all tests

test-web: ## Run frontend tests
	@npm run test

test-api: ## Run backend tests
	@cd apps/api && . .venv/bin/activate && pytest -q

ci: lint typecheck test ## Run CI checks locally

# -----------------------------------------------------------------------------
# Cleanup
# -----------------------------------------------------------------------------
clean: ## Remove caches and build artifacts
	@rm -rf apps/web/.next apps/web/out apps/web/coverage
	@rm -rf apps/api/.pytest_cache apps/api/.mypy_cache apps/api/.ruff_cache
	@rm -rf apps/api/htmlcov apps/api/.coverage
	@find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	@find . -type d -name ".turbo" -exec rm -rf {} + 2>/dev/null || true
	@echo "Cleaned"

reset: down clean ## Stop containers and wipe volumes
	docker compose down -v
	@echo "Reset complete"
