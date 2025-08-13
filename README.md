## Redrawn

Monorepo for Go API (Fuego + Ent + Atlas) and Next.js frontend.

### Dev
- Copy `.env.example` to `.env`, fill values.
- Start Postgres: `docker compose up -d postgres`
- API: `make api` (health: GET /v1/health)
- Web: `make web` (served via Caddy at http://localhost)

### Migrations
```
make migrate-diff
make migrate-apply
```

### OpenAPI
```
make openapi
```

