# Chimera FSU-1X — The Odds API

Fractional Service Unit wrapping [The Odds API v4](https://the-odds-api.com).
Provides normalised odds data across 70+ sports and 40+ bookmakers via a
secured REST API with its own key management layer.

---

## Architecture

```
GitHub (main branch)
  ├── backend/   → Cloud Run (europe-west2, beta-fsu1x)
  └── frontend/  → Cloudflare Pages (auto-deploy)
```

## Live URLs

| Service | URL |
|---------|-----|
| Frontend | `https://fsu1x.thync.online` |
| Backend (Cloud Run) | `https://beta-fsu1x-950990732577.europe-west2.run.app` |
| Swagger UI | `https://beta-fsu1x-950990732577.europe-west2.run.app/docs` |
| Health check | `https://beta-fsu1x-950990732577.europe-west2.run.app/health` |

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | None | Health check |
| GET | `/v1/sports` | X-API-Key | List in-season sports |
| GET | `/v1/odds/{sport}` | X-API-Key | Odds for a sport |
| GET | `/v1/odds/{sport}/{event_id}` | X-API-Key | Single event odds |
| GET | `/v1/events/{sport}` | X-API-Key | Events without odds |
| GET | `/v1/scores/{sport}` | X-API-Key | Live/recent scores |
| POST | `/v1/keys` | X-Admin-Key | Create consumer key |
| GET | `/v1/keys` | X-Admin-Key | List all keys |
| DELETE | `/v1/keys/{key_id}` | X-Admin-Key | Revoke a key |

---

## CI/CD Pipeline

```
VSCode → commit & push to GitHub (main)
  ├── Cloud Build trigger → builds backend → deploys to Cloud Run
  └── Cloudflare Pages trigger → builds frontend → deploys globally
```

Push to `main` is all that's needed. Both services update automatically.

---

## Cloud Run Setup (backend)

### Environment Variables (set in Cloud Run console)

| Variable | Value |
|----------|-------|
| `ODDS_API_KEY` | Your Odds API key from the-odds-api.com |
| `ADMIN_KEY` | Generate: `python3 -c "import secrets; print('admin_' + secrets.token_urlsafe(32))"` |
| `GCP_PROJECT` | `chimera-v4` |
| `ALLOWED_ORIGINS` | `["https://fsu1x.thync.online","https://fsu-1x.pages.dev"]` |

### Build type
Uses **Google Cloud Buildpacks** (no Dockerfile needed).
- Build context directory: `backend`
- Entry point: leave blank (uses `Procfile`)

### Notes
- OPTIONS preflight requests are exempted from API key auth so CORS works correctly
- Env vars are set directly in the Cloud Run console (no Secret Manager required)

---

## Cloudflare Pages Setup (frontend)

| Setting | Value |
|---------|-------|
| Framework preset | Vite |
| Build command | `npm run build` |
| Output directory | `dist` |
| Root directory | `frontend` |

### Environment Variables (Production)

| Variable | Value |
|----------|-------|
| `VITE_API_BASE_URL` | `https://beta-fsu1x-950990732577.europe-west2.run.app` |
| `VITE_FSU_API_KEY` | A `fsu1x_` consumer key — generate via Key Manager below |

After changing env vars, trigger a manual redeploy in Cloudflare Pages dashboard.

---

## Generating a Consumer Key

After backend is deployed:

```bash
# Create a key
curl -X POST https://beta-fsu1x-950990732577.europe-west2.run.app/v1/keys \
  -H "X-Admin-Key: YOUR_ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name": "cloudflare-frontend"}'

# List all keys
curl https://beta-fsu1x-950990732577.europe-west2.run.app/v1/keys \
  -H "X-Admin-Key: YOUR_ADMIN_KEY"
```

Copy the `fsu1x_` value and set it as `VITE_FSU_API_KEY` in Cloudflare Pages.

---

## Local Development

### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in ODDS_API_KEY and ADMIN_KEY
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env   # set VITE_API_BASE_URL=http://localhost:8000
npm run dev
```

---

## Quota Notes

- Sports list: free (no quota cost)
- Events list: free (no quota cost)
- Odds: 1 credit per region per market
- Scores with history: 2 credits
- Cache prevents repeat calls: 5min pre-match, 60s in-play, 1hr sports

Current plan: free tier (500 credits/month). Upgrade at the-odds-api.com.
