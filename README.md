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
- **Integrations**: Stripe, Cloudflare Images/R2, OpenAI

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
2) Start Postgres:
```bash
docker compose up -d postgres
```
3) Run the stack:
```bash
make dev
```
Then visit `http://localhost`.

### API
- Generated spec lives at `api/doc/openapi.json`. Regenerate with:
```bash
make openapi
```
- The web client (`web/src/services/genApi.ts`) is generated via:
```bash
make generate-clients
```

### Development and setup
For full environment variables, credentials, and detailed workflows, see:

- `docs/SETUP.md`

### Roadmap
See `TODO.md` for planned tasks and ideas.

### Contributing
Issues and PRs are welcome. For larger changes, please open an issue to discuss first.

### License
License to be determined.
