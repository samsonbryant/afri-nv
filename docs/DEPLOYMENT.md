# Novixa deployment — Render (API) + Vercel (web)

| Piece | Host |
|-------|------|
| Django API + Celery + Postgres + Redis | **Render** |
| Next.js frontend | **Vercel** |

---

## 1. Backend on Render

`render.yaml` defines:

- `novixa-api` — Django (Docker)
- `novixa-celery` — Celery worker
- `novixa-redis` — Redis
- `novixa-db` — Postgres 16 on plan `basic-256mb` (`DATABASE_URL` wired automatically)

> Postgres plan must be a current type (`free`, `basic-256mb`, `basic-1gb`, …). Legacy `starter` is rejected for new databases.

### Deploy

1. Push the repo to GitHub.
2. Render → **New** → **Blueprint** → select the repo (uses `render.yaml`).
3. Fill sync:false env vars in the dashboard:

```
ALLOWED_HOSTS=novixa-api.onrender.com
CORS_ALLOWED_ORIGINS=https://novixa-omega.vercel.app
CSRF_TRUSTED_ORIGINS=https://novixa-omega.vercel.app
FRONTEND_URL=https://novixa-omega.vercel.app
OPENAI_API_KEY=...
MTN_MOMO_NUMBER=670000000
MTN_MOMO_ACCOUNT_NAME=Novixa
ORANGE_MONEY_NUMBER=690000000
ORANGE_MONEY_ACCOUNT_NAME=Novixa
MANUAL_PAYMENT_CURRENCY=xaf
MANUAL_PAYMENT_USD_TO_LOCAL_RATE=600
GOOGLE_OAUTH_CLIENT_ID=...
GITHUB_OAUTH_CLIENT_ID=...
GITHUB_OAUTH_CLIENT_SECRET=...
SENTRY_DSN=...
SOCIAL_AUTH_STUB=False
```

`ALLOWED_HOSTS` defaults in the blueprint; the API also auto-appends Render’s `RENDER_EXTERNAL_HOSTNAME` so health checks pass even if the env var is empty. Blank `CORS_*` / `CSRF_*` values are ignored, and `FRONTEND_URL` is always merged into both. `SECRET_KEY`, `DATABASE_URL`, Redis URLs, and `JWT_SIGNING_KEY` are provided by the blueprint.

4. After first deploy, open the API shell or one-off job and run:

```bash
python manage.py migrate --noinput
python manage.py createsuperuser
```

Enable pgvector on Render Postgres if your plan supports extensions:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

Health check: `GET /api/v1/health/`

---

## 2. Frontend on Vercel

Do **not** deploy the Next.js app on Render. Use Vercel only.

| Setting | Value |
|---------|-------|
| Framework | Next.js |
| Root Directory | `apps/web` |
| Install Command | default (`npm install`) |
| Build Command | `npm run build` |

Root `prepare` skips Husky when `CI` or `VERCEL` is set, so installs do not fail on Vercel.

### Vercel environment variables

```
NEXT_PUBLIC_APP_URL=https://novixa-omega.vercel.app
NEXT_PUBLIC_API_URL=/api/v1
API_PROXY_TARGET=https://novixa-api.onrender.com
NEXT_PUBLIC_APP_NAME=Novixa
NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID=...
NEXT_PUBLIC_GITHUB_OAUTH_CLIENT_ID=...
```

**ISP / Orange Liberia note:** Lonestar MTN and Orange GSM can load the Vercel frontend, but Orange often cannot reach Render (`*.onrender.com`). The web app therefore calls same-origin `/api/v1` and `/media`; App Router handlers on Vercel proxy those to `API_PROXY_TARGET` over HTTPS (do not use Next rewrites — they forward the Vercel `Host` and trip Django `SECURE_SSL_REDIRECT` into a redirect loop). Do **not** set `NEXT_PUBLIC_API_URL` to the raw Render URL in production.

`API_PROXY_TARGET` is server-only (available to Route Handlers at runtime). After changing these, redeploy the Vercel project.

The Next app sets `skipTrailingSlashRedirect: true` so Django-style `/api/v1/.../` paths are preserved.
Deploy via the Vercel dashboard (import GitHub repo, root `apps/web`) or:

```bash
npx vercel --prod
```

`apps/web/vercel.json` sets the framework hint.

---

## 3. CORS / OAuth checklist

1. Note Render API HTTPS URL (used only as `API_PROXY_TARGET` on Vercel).
2. Note Vercel HTTPS URL (what users and OAuth providers hit).
3. Set Render `CORS_ALLOWED_ORIGINS`, `CSRF_TRUSTED_ORIGINS`, `FRONTEND_URL` to the Vercel URL (still needed for any direct API tooling).
4. Point Google/GitHub OAuth redirect URIs at the Vercel domain (`/auth/callback/google`, `/auth/callback/github`).
5. Smoke test on **both** Lonestar and Orange: register, login, billing, avatar upload. Confirm Network tab shows API calls to `novixa-omega.vercel.app/api/v1/...`, not `onrender.com`.
6. Optional: open `https://novixa-omega.vercel.app/api/v1/health/` — should proxy through to Django.

---

## 4. CI deploy hooks

`.github/workflows/deploy.yml` can POST to:

- `RENDER_API_DEPLOY_HOOK` — rebuild API on Render
- `VERCEL_DEPLOY_HOOK` — optional Vercel deploy hook

Wire these as GitHub Actions secrets.

---

## 5. Security notes

- Never commit `DATABASE_URL`, OAuth secrets, or `SECRET_KEY`.
- Keep `SOCIAL_AUTH_STUB=False` in production.
- See `docs/INTEGRATIONS.md` for OpenAI, Google, GitHub, and 2FA setup.
