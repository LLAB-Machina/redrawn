# Redrawn

Generate themed, on‑brand visuals from your photos and share them as collaborative albums.

## Quick Start

```bash
make install    # Install dependencies
make init-env   # Create .env file
make db-up      # Start PostgreSQL
make migrate-up # Apply migrations
make api        # Run backend (separate terminal)
make web        # Run frontend (separate terminal)
```

## Development

### Prerequisites
- Go 1.22+
- Node.js 20+ with Bun
- PostgreSQL 16 (via Docker)
- dbmate for migrations

### Environment Setup
```bash
cp .env.example .env
# Edit .env with your values
```

### Database
```bash
make db-up              # Start Postgres
make migrate-up         # Apply migrations
make migrate-new name=  # Create new migration
make reset-db           # Reset database (DANGER)
```

### Running Services
```bash
make api    # Backend on :8080 (with hot reload via air)
make web    # Frontend on :3000
```

### Code Generation
```bash
make generate-clients   # Regenerate OpenAPI + Jet + RTK Query
make jet-gen           # Regenerate Jet types from DB
make openapi           # Regenerate OpenAPI spec
```

### Code Quality
```bash
make format    # Format all code
make lint      # Lint all code (must pass 0 issues)
make test      # Run all tests
```

## Tech Stack

- **Backend:** Go, Fuego (HTTP + OpenAPI), Jet SQL, PostgreSQL
- **Frontend:** Next.js (Pages Router), RTK Query, Tailwind CSS, Bun
- **Storage:** S3-compatible (R2/MinIO)
- **Payments:** Stripe
- **Image Generation:** OpenAI

## Project Structure

```
redrawn/
├── api/              # Go backend
│   ├── cmd/api/      # Main entry point
│   ├── internal/     # Internal packages
│   │   ├── gen/      # Generated Jet types (NEVER EDIT)
│   │   ├── handlers/ # HTTP handlers
│   │   ├── services/ # Business logic
│   │   └── app/      # App context
│   └── openapi.json  # Generated OpenAPI spec
├── web/              # Next.js frontend
│   ├── pages/        # Page routes
│   └── src/
│       ├── services/ # RTK Query
│       └── components/
├── db/migrations/    # SQL migrations (dbmate)
├── plans/            # Implementation plans
└── Makefile          # Dev commands
```

## Architecture

Follows immutable versioning pattern (same as autobok):
- All entities have `group_id` for revision tracking
- `status` field: staged | confirmed | deleted
- Soft deletes via status changes

## License

MIT
