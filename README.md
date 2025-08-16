## Redrawn

Generate themed, on‑brand visuals from your photos and share them as collaborative albums. This repo is a monorepo with a Go API and a Next.js web app.

### Highlights
- **Albums and collaboration**: Create albums, invite members, manage roles.
- **Originals to variants**: Upload originals, generate themed images via background tasks.
- **Themes**: Define reusable themes with CSS tokens and prompts.
- **Public pages**: Publish shareable album pages by slug.
- **Authentication**: Magic links and Google Sign‑In.
- **Billing and credits**: Stripe checkout and credit accounting.
- **Typed API**: OpenAPI‑driven server and generated web client.

### Tech stack
- **Backend**: Go, `github.com/go-fuego/fuego` (HTTP + OpenAPI), Ent (ORM), Atlas (migrations), Postgres
- **Frontend**: Next.js (React), RTK Query (generated client), Tailwind CSS
- **Infra**: Docker Compose, Caddy (local reverse proxy)
- **Integrations**: Stripe, R2 (S3-compatible), OpenAI

### Monorepo layout
```text
api/           Go service (handlers, services, middleware, Ent, Atlas)
web/           Next.js app (pages, RTK Query client, Tailwind)
migrations/    Atlas SQL migrations
Makefile       Common developer tasks (dev, openapi, generate-clients, etc.)
```

### Quick start
1) Install prerequisites and deps (macOS):
```bash
make install
```
2) Create and review your environment file (`.env`):
```bash
make init-env
```
3) Start Postgres:
```bash
make db-up
```
4) Apply database migrations (Atlas) and background worker migrations (River):
```bash
make uphead
make river-up
```

5) Seed initial data (themes, etc.):
```bash
make seed-db
```
6) Start the API:
```bash
make api
```
7) Start the frontend:
```bash
make web
```
Then visit `http://localhost:3000`.

Add all missing secrets to your `.env` file:

8) Optional: Stripe webhooks for local billing flows
```bash
make local-stripe          # logs in (once), writes STRIPE_WEBHOOK_SECRET to .env, starts forwarding
make local-stripe-trigger  # trigger a sample event
```

8) Useful commands
```bash
make code-gen   # regenerate Ent, OpenAPI JSON, and web client
make lint       # lint Go and Web
make test       # run tests
make format     # format code
make db-down    # stop Postgres container
make reset-db   # drop + recreate schema and re-apply migrations (DANGER)
```
