# Novixa integrations guide

What to wire for Novixa to run in **local**, **staging**, and **production**.
Missing optional keys usually fall back to stubs; missing **required** infra breaks the product.

| Copy env into         | Role                                |
| --------------------- | ----------------------------------- |
| Monorepo `.env`       | Django API (reads repo-root `.env`) |
| `apps/web/.env.local` | Local Next.js                       |
| Render service env    | Production API + Celery             |
| Vercel project env    | Production web                      |

Also see [DEPLOYMENT.md](./DEPLOYMENT.md) for Render + Vercel hosting.

---

## Priority matrix

| Priority                        | Integration                            | Without it                                               |
| ------------------------------- | -------------------------------------- | -------------------------------------------------------- |
| **Required**                    | PostgreSQL (+ pgvector recommended)    | App will not start / migrate                             |
| **Required**                    | Redis                                  | Cache/Celery URLs fail; jobs unreliable                  |
| **Required (prod web)**         | `API_PROXY_TARGET` on Vercel           | Browser cannot reach API on some ISPs                    |
| **Required (AI features)**      | OpenAI or OpenRouter key               | Assistant, agents, knowledge RAG, marketing AI stub/fail |
| **Strongly recommended (prod)** | Celery worker **or** inline processing | Knowledge/reports stay pending                           |
| **Recommended (prod)**          | Real SMTP                              | Password reset / email verify stay console-only          |
| **Optional**                    | Google / GitHub OAuth                  | Email/password still works; social uses stubs in DEBUG   |
| **Optional**                    | Dodo Payments                          | Card checkout uses local stub session + attach-card      |
| **Optional**                    | MTN / Orange MoMo numbers              | Manual payment instructions empty                        |
| **Optional**                    | Meta Graph / WhatsApp                  | Social connect is verified-local stub, not live Graph    |
| **Optional**                    | Google / Microsoft calendar OAuth      | Meeting calendar connect returns stub OAuth URLs         |
| **Optional**                    | S3                                     | Local/disk media (fine for small deploys)                |
| **Optional**                    | Sentry                                 | No error telemetry                                       |

---

## 1. Core infrastructure (required)

### PostgreSQL + pgvector

| Variable       | Example                                   |
| -------------- | ----------------------------------------- |
| `DATABASE_URL` | `postgresql://user:pass@host:5432/novixa` |

On Render Postgres (if extensions allowed):

```sql
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

pgvector powers knowledge / RAG embeddings when `USE_PGVECTOR` is enabled.

### Redis

| Variable                | Default / notes |
| ----------------------- | --------------- |
| `REDIS_URL`             | `redis://.../0` |
| `CELERY_BROKER_URL`     | `redis://.../1` |
| `CELERY_RESULT_BACKEND` | `redis://.../2` |
| `CACHE_URL`             | `redis://.../3` |

### App / security

| Variable               | Notes                                                 |
| ---------------------- | ----------------------------------------------------- |
| `SECRET_KEY`           | Long random string in production                      |
| `JWT_SIGNING_KEY`      | Defaults to `SECRET_KEY` if unset                     |
| `FRONTEND_URL`         | Vercel origin, e.g. `https://novixa-omega.vercel.app` |
| `ALLOWED_HOSTS`        | API hostname(s)                                       |
| `CORS_ALLOWED_ORIGINS` | Vercel origin                                         |
| `CSRF_TRUSTED_ORIGINS` | Vercel origin (https)                                 |

### Frontend ↔ API (production)

| Variable                | Where                  | Value                             |
| ----------------------- | ---------------------- | --------------------------------- |
| `NEXT_PUBLIC_API_URL`   | Vercel                 | `/api/v1` (same-origin)           |
| `API_PROXY_TARGET`      | Vercel **server-only** | `https://novixa-api.onrender.com` |
| `NEXT_PUBLIC_APP_URL`   | Vercel                 | Public site URL                   |
| `NEXT_PUBLIC_DEMO_MODE` | Vercel                 | `false`                           |

Browsers must **not** call Render directly on networks that block `*.onrender.com` (e.g. some Orange Liberia routes). The Next.js `/api/v1/*` Route Handler proxies to `API_PROXY_TARGET`.

---

## 2. AI / LLM (required for AI product surfaces)

Powers: Assistant, Agents, Knowledge chat/RAG, Marketing copy, Documents Ask AI, Support AI draft, Reports narrative.

| Variable                | Required        | Notes                                       |
| ----------------------- | --------------- | ------------------------------------------- |
| `OPENAI_API_KEY`        | Yes for live AI | OpenAI `sk-...` or OpenRouter `sk-or-...`   |
| `OPENAI_BASE_URL`       | For OpenRouter  | `https://openrouter.ai/api/v1`              |
| `AI_DEFAULT_PROVIDER`   | No              | `openai`                                    |
| `AI_DEFAULT_MODEL`      | No              | Prefer `gpt-4o-mini` / `openai/gpt-4o-mini` |
| `AI_MAX_TOKENS`         | No              | Default `1024`; lower if credits are tight  |
| `FREE_AI_REQUEST_LIMIT` | No              | Free-plan monthly chat cap (default `5`)    |
| `FREE_AI_MAX_TOKENS`    | No              | Free-plan completion cap                    |
| `EMBEDDING_MODEL`       | No              | `text-embedding-3-small`                    |
| `EMBEDDING_DIMENSIONS`  | No              | `1536`                                      |
| `ANTHROPIC_API_KEY`     | No              | Optional alternate provider                 |

### OpenRouter

1. Create key → https://openrouter.ai/keys
2. Add credits → https://openrouter.ai/settings/credits
3. Set:

```
OPENAI_API_KEY=sk-or-...
OPENAI_BASE_URL=https://openrouter.ai/api/v1
AI_DEFAULT_MODEL=gpt-4o-mini
AI_MAX_TOKENS=1024
```

### OpenAI platform

1. Billing + credits → https://platform.openai.com/settings/organization/billing
2. API key → https://platform.openai.com/api-keys
3. Ensure chat + embeddings models are enabled.

**Never** put LLM keys in `NEXT_PUBLIC_*`.

### Verify

```bash
cd apps/api && . .venv/bin/activate
python -c "import django,os; os.environ.setdefault('DJANGO_SETTINGS_MODULE','config.settings'); django.setup(); from infrastructure.ai.llm import get_llm_service; print(get_llm_service().complete('Say OK'))"
```

---

## 3. Authentication

### Email / password + JWT

Works with only `SECRET_KEY` / `JWT_SIGNING_KEY`. No third party required.

### Two-factor (TOTP)

Built-in (no external SaaS). Settings → Security:

| Step         | Endpoint                                               |
| ------------ | ------------------------------------------------------ |
| Setup        | `POST /api/v1/auth/2fa/setup/`                         |
| Confirm      | `POST /api/v1/auth/2fa/confirm/` `{ code }`            |
| Disable      | `POST /api/v1/auth/2fa/disable/` `{ password, code }`  |
| Login verify | `POST /api/v1/auth/2fa/verify/` `{ temp_token, code }` |

Scan otpauth URI with Google Authenticator / 1Password / Authy.

### Google Sign-In

| Variable                             | Where                       |
| ------------------------------------ | --------------------------- |
| `GOOGLE_OAUTH_CLIENT_ID`             | API                         |
| `NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID` | Web (same client ID)        |
| `FRONTEND_URL`                       | API                         |
| `SOCIAL_AUTH_STUB`                   | API — `False` in production |

**Setup**

1. Google Cloud Console → Credentials → OAuth client (Web).
2. Authorized JavaScript origins: local `http://localhost:3000` + Vercel URL.
3. Redirect URIs:
   - `http://localhost:3000/auth/callback/google`
   - `https://<vercel>/auth/callback/google`
4. Configure OAuth consent screen.

Without credentials in DEBUG, Google button uses a stub user.

### GitHub Sign-In

| Variable                     | Where                                             |
| ---------------------------- | ------------------------------------------------- |
| `GITHUB_OAUTH_CLIENT_ID`     | API + `NEXT_PUBLIC_GITHUB_OAUTH_CLIENT_ID` on web |
| `GITHUB_OAUTH_CLIENT_SECRET` | API **only** (never public)                       |

**Setup**

1. GitHub → Developer settings → OAuth Apps.
2. Callback:
   - `http://localhost:3000/auth/callback/github`
   - `https://<vercel>/auth/callback/github`

---

## 4. Billing & payments

Payments are **USD only**.

### Card / trial (Dodo)

- `DODO_API_KEY`: empty enables local stub checkout.
- `DODO_WEBHOOK_SECRET`: Standard Webhooks signing secret (`whsec_...`).
- `DODO_ENVIRONMENT`: `test_mode` or `live_mode`.
- `DODO_PRODUCT_STARTER`, `DODO_PRODUCT_GROWTH`, `DODO_PRODUCT_SCALE`: recurring Dodo product IDs.

**Flow today**

1. User starts plan → API creates a pending subscription and hosted checkout URL.
2. Stub mode redirects to in-app checkout page and attaches a card reference.
3. Live mode activates the trial only after a signed Dodo success webhook confirms payment.
4. Dodo renews the recurring subscription after the trial; signed webhooks update Novixa access.

To go live: create recurring products in Dodo, configure the product IDs, register
`/api/v1/billing/webhooks/dodo/`, and set the API and webhook keys.

### Manual mobile money (MTN / Orange)

Shown as “Pay with MoMo instead” instructions (admin approval flow).

| Variable                    | Example              |
| --------------------------- | -------------------- |
| `MTN_MOMO_NUMBER`           | Business MoMo number |
| `MTN_MOMO_ACCOUNT_NAME`     | `Novixa`             |
| `ORANGE_MONEY_NUMBER`       | Orange Money number  |
| `ORANGE_MONEY_ACCOUNT_NAME` | `Novixa`             |
| `MANUAL_PAYMENT_CURRENCY`   | `usd` (forced)       |

---

## 5. Marketing — Facebook / Instagram / WhatsApp (Meta)

| Variable                        | Purpose                                    |
| ------------------------------- | ------------------------------------------ |
| `META_GRAPH_ACCESS_TOKEN`       | Page/user token for Graph verify + publish |
| `META_WHATSAPP_PHONE_NUMBER_ID` | WhatsApp Cloud phone number ID             |
| `META_WHATSAPP_DEFAULT_TO`      | Default E.164 recipient for WA sends       |

**Behavior**

- **No token:** connect still marks the channel **connected / verified realtime** (local stub) so workflows work.
- **Token present (and not `stub*` / `tok_*`):** `MetaGraphClient` calls Graph `/me`, page feed publish, and WhatsApp messages.

**Live Meta checklist**

1. Meta Developer App → add Facebook Login / WhatsApp product.
2. Generate a long-lived Page or System User token with `pages_manage_posts`, `whatsapp_business_messaging` as needed.
3. Set env on Render; paste token in Marketing → Connect (optional UI field) or rely on `META_GRAPH_ACCESS_TOKEN`.
4. For WhatsApp: register a Cloud API number; set phone number ID + test `to` number.

Client: `apps/api/infrastructure/external/meta_graph.py`.

---

## 6. Meetings (Google Meet / Teams / Zoom / Calendar)

| Variable                        | Purpose                               |
| ------------------------------- | ------------------------------------- |
| `GOOGLE_CALENDAR_CLIENT_ID`     | Google Calendar OAuth (optional)      |
| `GOOGLE_CALENDAR_CLIENT_SECRET` | Google Calendar secret                |
| `MICROSOFT_CLIENT_ID`           | Microsoft / Teams calendar (optional) |

**Current behavior**

- Creating a meeting with Meet / Zoom / Teams / in-app (`novixa`) generates a **stub join URL** shaped like the provider.
- Calendar “Connect” returns a stub OAuth URL unless real client IDs are configured and a full OAuth callback is implemented.

To go fully live: implement provider OAuth callbacks and call Google Calendar / Microsoft Graph / Zoom APIs to create real events and meeting rooms.

---

## 7. Knowledge & reports background processing

| Variable                   | Default                       | Notes                                                        |
| -------------------------- | ----------------------------- | ------------------------------------------------------------ |
| `KNOWLEDGE_PROCESS_INLINE` | `True`                        | Process uploads in the web request (no Celery worker needed) |
| `REPORTS_PROCESS_INLINE`   | `True`                        | Same for report generation                                   |
| `CELERY_TASK_ALWAYS_EAGER` | `True` in local `development` | Forces all Celery tasks inline                               |

**Production recommendation**

- Small deploy / no worker: leave `KNOWLEDGE_PROCESS_INLINE=True` and `REPORTS_PROCESS_INLINE=True`.
- Dedicated `novixa-celery` worker: set both to `False` so jobs run on the worker (avoids long HTTP requests).

Upload / generate still need a working LLM + embeddings for useful RAG/report content.

---

## 8. Email (recommended in production)

| Variable                                  | Notes                                               |
| ----------------------------------------- | --------------------------------------------------- |
| `EMAIL_BACKEND`                           | Prod: `django.core.mail.backends.smtp.EmailBackend` |
| `EMAIL_HOST`                              | e.g. `smtp.sendgrid.net` / SES / Mailgun            |
| `EMAIL_PORT`                              | `587`                                               |
| `EMAIL_HOST_USER` / `EMAIL_HOST_PASSWORD` | Provider credentials                                |
| `DEFAULT_FROM_EMAIL`                      | `noreply@yourdomain.com`                            |

Used for password reset and email verification. Development uses console backend.

---

## 9. File storage (optional)

| Variable                                      | Notes                        |
| --------------------------------------------- | ---------------------------- |
| `USE_S3`                                      | `False` → local `MEDIA_ROOT` |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | S3 or compatible             |
| `AWS_STORAGE_BUCKET_NAME`                     | Bucket                       |
| `AWS_S3_REGION_NAME`                          | e.g. `us-east-1`             |
| `AWS_S3_ENDPOINT_URL`                         | Optional (R2, MinIO, etc.)   |

Knowledge documents and avatars use default storage. On Render disk is ephemeral — use S3 for durable uploads in production.

---

## 10. Observability (optional)

| Variable             | Notes                        |
| -------------------- | ---------------------------- |
| `SENTRY_DSN`         | API Sentry project           |
| `SENTRY_ENVIRONMENT` | `production` / `development` |
| `LOG_LEVEL`          | `INFO` / `DEBUG`             |

---

## 11. Admin bootstrap

After migrate on a fresh API:

```bash
python manage.py bootstrap_admin
# Set ADMIN_EMAIL and a strong ADMIN_PASSWORD before running bootstrap_admin.
```

Change the password immediately. Platform admin routes require `is_staff=True`.

---

## Environment cheat sheet (production)

### Render (API)

```
FRONTEND_URL=https://novixa-omega.vercel.app
CORS_ALLOWED_ORIGINS=https://novixa-omega.vercel.app
CSRF_TRUSTED_ORIGINS=https://novixa-omega.vercel.app
OPENAI_API_KEY=...
OPENAI_BASE_URL=https://openrouter.ai/api/v1
AI_DEFAULT_MODEL=gpt-4o-mini
SOCIAL_AUTH_STUB=False
GOOGLE_OAUTH_CLIENT_ID=...
GITHUB_OAUTH_CLIENT_ID=...
GITHUB_OAUTH_CLIENT_SECRET=...
MTN_MOMO_NUMBER=...
MTN_MOMO_ACCOUNT_NAME=Novixa
ORANGE_MONEY_NUMBER=...
ORANGE_MONEY_ACCOUNT_NAME=Novixa
DODO_API_KEY=                 # optional until live cards
DODO_WEBHOOK_SECRET=
DODO_ENVIRONMENT=live_mode
DODO_PRODUCT_STARTER=
DODO_PRODUCT_GROWTH=
DODO_PRODUCT_SCALE=
META_GRAPH_ACCESS_TOKEN=      # optional until live social
META_WHATSAPP_PHONE_NUMBER_ID=
META_WHATSAPP_DEFAULT_TO=
USE_S3=True
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_STORAGE_BUCKET_NAME=novixa-production
AWS_S3_ENDPOINT_URL=          # required for R2/Spaces; omit for AWS S3
AWS_S3_CUSTOM_DOMAIN=        # optional CDN/public bucket domain
KNOWLEDGE_PROCESS_INLINE=True
REPORTS_PROCESS_INLINE=True
SENTRY_DSN=
```

### Vercel (web)

```
NEXT_PUBLIC_APP_URL=https://novixa-omega.vercel.app
NEXT_PUBLIC_API_URL=/api/v1
API_PROXY_TARGET=https://novixa-api.onrender.com
NEXT_PUBLIC_APP_NAME=Novixa
NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID=...
NEXT_PUBLIC_GITHUB_OAUTH_CLIENT_ID=...
NEXT_PUBLIC_DEMO_MODE=false
```

---

## Smoke checklist after wiring

1. `GET /api/v1/health/` (via Vercel proxy).
2. Register / login; confirm redirect to the 15-day trial step.
3. Choose a plan, attach a card, complete the business profile, and upload a logo.
4. Confirm dashboard access remains blocked until onboarding is complete.
5. Settings → enable 2FA with an authenticator app.
6. Knowledge → upload a file → status becomes `ready`.
7. Marketing → connect Facebook/WhatsApp (stub or live token).
8. Meetings → create Meet/Zoom/Teams meeting → join URL present.
9. Reports → generate a report → content appears.
10. CRM → create a company (organization must be selected).

Ignore browser console noise from extensions (Quillbot, Grammarly, `Receiving end does not exist`).
