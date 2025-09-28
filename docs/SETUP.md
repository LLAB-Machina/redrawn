## Setup and Development

This document contains detailed setup instructions, environment variables, and credential notes for local development.

### Local dev
- Copy `.env.example` to `.env` (or run `make init-env`) and fill values.
- Start Postgres: `docker compose up -d postgres`
- API: `make api` (health: GET /v1/health)
- Web: `make web` (served via Caddy at http://localhost)

### Environment variables
Set these in `.env` (defaults are acceptable for many during local dev). A complete example is provided in `.env.example`; run `make init-env` to copy it.

Required (core)
- `DATABASE_URL`: Postgres connection string. Example: `postgres://redrawn:redrawn@localhost:5432/redrawn?sslmode=disable`
- `SESSION_SECRET`: Random string for signing sessions.
- `PUBLIC_BASE_URL`: Base URL of your web app. For local Next on 3000 use `http://localhost:3000`; with Caddy proxy use `http://localhost`.

Google Sign-In
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`: From Google Cloud Console OAuth credentials.
- Redirect URI to configure at Google: `{PUBLIC_BASE_URL}/api/server/v1/auth/google/callback`.

Cloudflare R2 (S3-compatible) storage
- `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_S3_ENDPOINT`, `R2_PUBLIC_BASE_URL`

Stripe (optional unless using billing)
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID`: Needed for checkout/webhooks. Also set `PUBLIC_BASE_URL` for return URLs.

OpenAI (optional; used for image generation)
- `OPENAI_API_KEY`: If omitted, generation runs in a no-op/dev mode.

Credits
- `CREDITS_PER_PURCHASE`: Credits added per one-off purchase (default 1).

Environment mode
- `ENV` or `APP_ENV`: `development` (default) or `production`. Controls `Dev` flag.

Frontend
- `NEXT_PUBLIC_API_BASE_URL`: Where the API is reachable from the browser for rewrites. Default is `http://localhost:8080` when running Next dev.
- `API_PROXY_TARGET`: Optional; used by Next.js rewrites to forward `/api/*` to the backend (defaults to `http://localhost:8080`).

### Google Sign-In
Set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `PUBLIC_BASE_URL` in `.env`.
Configure Google OAuth redirect URI to `{PUBLIC_BASE_URL}/api/server/v1/auth/google/callback`.

### Credential setup (where to find each value)

#### Google OAuth (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET)
- Go to Google Cloud Console → APIs & Services → Credentials
- Create credentials → OAuth client ID → Application type: Web application
- Authorized redirect URIs:
  - If running Next on 3000: `http://localhost:3000/api/server/v1/auth/google/callback`
  - If using Caddy at http://localhost: `http://localhost/api/server/v1/auth/google/callback`
- (Optional) Authorized JavaScript origins: `http://localhost:3000` and/or `http://localhost`
- Copy Client ID and Client Secret to `.env`

#### Cloudflare R2 (S3-compatible storage)
- Cloudflare Dashboard → R2
- Create a bucket (e.g., `redrawn-dev`)
- R2 S3 API keys: R2 → Settings → S3 API → Create Access Key → copy Access Key ID and Secret Access Key
- Account ID and S3 endpoint: shown in the same page
  - Endpoint format: `https://<account_id>.r2.cloudflarestorage.com`
- (Optional) Public domain for the bucket: R2 → Settings → Domains → add a custom domain (e.g., `assets.example.com`)
- Set in `.env`:
  - `R2_ACCESS_KEY_ID`
  - `R2_SECRET_ACCESS_KEY`
  - `R2_BUCKET`
  - `R2_S3_ENDPOINT` (e.g., `https://<account_id>.r2.cloudflarestorage.com`)
  - `R2_PUBLIC_BASE_URL` (e.g., `https://assets.example.com` if public; leave empty if you plan to presign GET URLs)

Note: Legacy Cloudflare Images variables have been removed.

#### Stripe (billing)
- Stripe Dashboard → Developers → API keys → copy Secret key → `STRIPE_SECRET_KEY`
- Stripe Dashboard → Developers → Webhooks → Add endpoint
  - Endpoint URL: `{PUBLIC_BASE_URL}/api/server/v1/stripe/webhook`
  - Select events: `checkout.session.completed`, `customer.subscription.*`, `invoice.payment_*`
  - Copy Signing secret → `STRIPE_WEBHOOK_SECRET`
- Products → select your product/price → copy Price ID → `STRIPE_PRICE_ID`

#### Local development URLs
- If running Next.js directly: set `PUBLIC_BASE_URL=http://localhost:3000`
- If serving via Caddy: set `PUBLIC_BASE_URL=http://localhost`
- Google allows `http://localhost` for redirect URIs in development

### Database and migrations
Generate and apply Atlas migrations:
```bash
make revision   # diff from Ent schemas into SQL migrations
make uphead     # apply migrations
```

Reset database (DANGER):
```bash
make reset-db
```

### OpenAPI & client generation
```bash
make openapi            # outputs api/doc/openapi.json
make generate-clients   # updates web/src/services/genApi.ts and related
```

### Linting, tests, formatting
```bash
make lint
make test
make format
```

### Running services individually
```bash
make api   # Go API
make web   # Next.js dev server
```

