# Novixa integrations

Fill these environment variables to enable production features.
Local development works with stubs when keys are missing (`DEBUG=True` / `SOCIAL_AUTH_STUB=True`).

Copy from `.env.example` into:
- monorepo `.env` (Django reads this)
- Vercel project env (frontend)
- Render / API host env (backend)

---

## 1. OpenAI (AI Assistant, Agents, Knowledge, Marketing, Documents)

### Code / env (backend `.env` or Render)

| Variable | Required | Example |
|----------|----------|---------|
| `OPENAI_API_KEY` | Yes | OpenAI `sk-...` / `sk-proj-...`, or OpenRouter `sk-or-...` |
| `OPENAI_BASE_URL` | For OpenRouter | `https://openrouter.ai/api/v1` (auto if key starts with `sk-or-`) |
| `AI_DEFAULT_PROVIDER` | No | `openai` |
| `AI_DEFAULT_MODEL` | No | OpenAI: `gpt-4o-mini` · OpenRouter: `openai/gpt-4o-mini` |
| `EMBEDDING_MODEL` | No | OpenAI: `text-embedding-3-small` · OpenRouter: `openai/text-embedding-3-small` |
| `EMBEDDING_DIMENSIONS` | No | `1536` |

Restart Django after changing `.env`. Without a key, Novixa uses stubs. With a key, it calls OpenAI; on API errors (quota, auth) it falls back and surfaces the error.

### OpenAI platform checklist

1. Create/login at https://platform.openai.com
2. **Billing** → add a payment method and buy credits  
   https://platform.openai.com/settings/organization/billing  
   `insufficient_quota` means the key is valid but the org has no usable balance.
3. **API keys** → create a secret key (project key is fine)  
   https://platform.openai.com/api-keys  
   Put it in `.env` as `OPENAI_API_KEY=...` (backend only — never `NEXT_PUBLIC_*`).
4. Confirm the project can use chat + embeddings models (`gpt-4o`, `text-embedding-3-small`).
5. Optional: set usage limits so spend stays bounded.

### Verify locally

```bash
cd apps/api && . .venv/bin/activate
python -c "import django,os; os.environ.setdefault('DJANGO_SETTINGS_MODULE','config.settings'); django.setup(); from infrastructure.ai.llm import get_llm_service; print(get_llm_service().complete('Say OK'))"
```

Success returns a short model reply. Quota failures mention `[openai-quota]`.

---

## 2. Google Sign-In

| Variable | Where | Notes |
|----------|--------|------|
| `GOOGLE_OAUTH_CLIENT_ID` | Backend | OAuth 2.0 Web client ID |
| `NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID` | Frontend (Vercel) | Same client ID (public) |
| `FRONTEND_URL` | Backend | e.g. `https://your-app.vercel.app` |

### Setup
1. Google Cloud Console → APIs & Services → Credentials → Create OAuth client (Web).
2. Authorized JavaScript origins: `http://localhost:3000`, your Vercel URL.
3. Authorized redirect URIs:  
   - `http://localhost:3000/auth/callback/google`  
   - `https://your-app.vercel.app/auth/callback/google`
4. Enable **Google Identity** / OAuth consent screen.

**Local without Google credentials:** clicking “Google” uses a backend stub (`mock:` token) and signs you in as `google.user@novixa.app`.

---

## 3. GitHub Sign-In

| Variable | Where | Notes |
|----------|--------|------|
| `GITHUB_OAUTH_CLIENT_ID` | Backend + Frontend `NEXT_PUBLIC_GITHUB_OAUTH_CLIENT_ID` | OAuth App client ID |
| `GITHUB_OAUTH_CLIENT_SECRET` | Backend **only** | Never expose to Vercel public env |

### Setup
1. GitHub → Settings → Developer settings → OAuth Apps → New.
2. Homepage URL: your Vercel URL.
3. Callback URL: `https://your-app.vercel.app/auth/callback/github`  
   (and `http://localhost:3000/auth/callback/github` for local).

**Local without GitHub credentials:** stub login as `github.user@novixa.app`.

---

## 4. Two-Factor Authentication (TOTP)

Works out of the box (pyotp). No third-party service required.

| Flow | Endpoint |
|------|----------|
| Start setup (returns secret + otpauth URI) | `POST /api/v1/auth/2fa/setup/` |
| Confirm with authenticator code | `POST /api/v1/auth/2fa/confirm/` |
| Login challenge | Login returns `requires_2fa` + `temp_token` |
| Verify | `POST /api/v1/auth/2fa/verify/` `{ temp_token, code }` |
| Disable | `POST /api/v1/auth/2fa/disable/` `{ password, code }` |

Users scan the otpauth URI with Google Authenticator / 1Password / Authy.

Optional email verification:
- `POST /api/v1/auth/email/resend/`
- `POST /api/v1/auth/email/verify/` `{ token }`  
Configure real SMTP (`EMAIL_HOST_*`) for production mail; console backend in development.

---

## 5. Other optional integrations

| Feature | Variables |
|---------|-----------|
| Sentry | `SENTRY_DSN`, `SENTRY_ENVIRONMENT` |
| Dodo Payments | `DODO_API_KEY`, webhook secret |
| Google Calendar | `GOOGLE_CALENDAR_CLIENT_ID`, `GOOGLE_CALENDAR_CLIENT_SECRET` |
| Microsoft / Zoom | Calendar / meeting client IDs in `.env.example` |
| Redis (prod) | `REDIS_URL`, `CELERY_BROKER_URL`, `CELERY_RESULT_BACKEND` |
| JWT | `JWT_SIGNING_KEY` / use `SECRET_KEY` |

---

## Quick admin accounts

| Env | Email | Password |
|-----|-------|----------|
| Local | `test@gmail.com` | `TestPass123!` (staff) |

Create a production superuser on Render after migrate (`python manage.py createsuperuser`).
