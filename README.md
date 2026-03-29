# Chimera FSU-1X — The Odds API

Fractional Service Unit wrapping [The Odds API v4](https://the-odds-api.com).
Provides normalised odds data across 70+ sports and 40+ bookmakers via a
secured REST API with its own key management layer.

---

## Architecture

```
GitHub (main branch)
  ├── backend/   → Cloud Run (europe-west2, chimera-v4)
  └── frontend/  → Cloudflare Pages (auto-deploy)
```

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

Swagger UI: `https://your-cloud-run-url/docs`

---

## First-time GCP Setup

Run these once from your terminal (gcloud CLI required):

```bash
# 1. Store secrets in Secret Manager
gcloud secrets create fsu1x-odds-api-key \
  --replication-policy=automatic \
  --project=chimera-v4
echo -n "8d96d1f0daa60bcd931806eb52232cbc" | \
  gcloud secrets versions add fsu1x-odds-api-key --data-file=- --project=chimera-v4

# 2. Generate and store admin key
python3 -c "import secrets; print('admin_' + secrets.token_urlsafe(32))"
# → copy the output, then:
echo -n "admin_YOUR_GENERATED_KEY" | \
  gcloud secrets versions add fsu1x-admin-key --data-file=- --project=chimera-v4

# 3. Grant Cloud Run SA access to secrets
gcloud projects add-iam-policy-binding chimera-v4 \
  --member="serviceAccount:$(gcloud iam service-accounts list \
    --filter='displayName:Default compute service account' \
    --format='value(email)' --project=chimera-v4)" \
  --role="roles/secretmanager.secretAccessor"

# 4. Create Firestore composite indexes (for key auth queries)
gcloud firestore indexes composite create \
  --collection-group=fsu_1x_api_keys \
  --field-config=field-path=key,order=ASCENDING \
  --field-config=field-path=is_active,order=ASCENDING \
  --project=chimera-v4
```

---

## Cloud Run Deploy (backend)

Cloud Build triggers on push to `main`. To trigger manually:

```bash
cd backend
gcloud builds submit \
  --config=cloudbuild.yaml \
  --project=chimera-v4
```

---

## Cloudflare Pages Setup (frontend)

In Cloudflare Pages dashboard → Connect to Git → `charles-ascot/beta-fsu1x`:

| Setting | Value |
|---------|-------|
| Framework preset | Vite |
| Build command | `npm run build` |
| Output directory | `dist` |
| Root directory | `frontend` |

Environment variables (Production):

| Variable | Value |
|----------|-------|
| `VITE_API_BASE_URL` | Your Cloud Run URL |
| `VITE_FSU_API_KEY` | A `fsu1x_` consumer key (generate via Key Manager) |

---

## First Consumer Key

After backend is deployed, create your first consumer key via curl:

```bash
curl -X POST https://your-cloud-run-url/v1/keys \
  -H "X-Admin-Key: your-admin-key" \
  -H "Content-Type: application/json" \
  -d '{"name": "mark-dashboard"}'
```

Copy the returned `key` value — use it as `VITE_FSU_API_KEY` in Cloudflare.

---

## Quota Notes

- Sports list: free (no quota cost)
- Events list: free (no quota cost)
- Odds: 1 credit per region per market
- Scores with history: 2 credits
- Cache prevents repeat calls: 5min pre-match, 60s in-play, 1hr sports

Current plan: free tier (500 credits/month). Upgrade at the-odds-api.com.
