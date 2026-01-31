# Redrawn Rebuild Plan

## Goal
Rebuild Redrawn following autobok's exact patterns: Go (Fuego, Jet SQL, dbmate) + Next.js (Pages Router, RTK Query, Tailwind, Bun).

## Core Features (from original)
1. **Albums** - Create, manage, collaborate
2. **Photos** - Upload originals, generate themed variants
3. **Themes** - CSS tokens + prompts for image generation
4. **Public pages** - Shareable album pages by slug
5. **Billing** - Stripe checkout, credit system
6. **Collaboration** - Invite members, manage roles

## Database Schema (dbmate migrations)

### users
- id TEXT PRIMARY KEY (NanoID)
- email TEXT UNIQUE NOT NULL
- name TEXT
- status TEXT CHECK (status IN ('active', 'inactive'))
- created_at TIMESTAMPTZ DEFAULT NOW()
- updated_at TIMESTAMPTZ DEFAULT NOW()

### albums
- id TEXT PRIMARY KEY
- group_id TEXT NOT NULL (immutable versioning)
- user_id TEXT NOT NULL (owner)
- name TEXT NOT NULL
- slug TEXT UNIQUE
- status TEXT CHECK (status IN ('staged', 'confirmed', 'deleted'))
- is_public BOOLEAN DEFAULT false
- password_hash TEXT (optional public access)
- created_at TIMESTAMPTZ DEFAULT NOW()
- confirmed_at TIMESTAMPTZ

### album_users (collaborators)
- id TEXT PRIMARY KEY
- album_id TEXT NOT NULL
- user_id TEXT NOT NULL
- role TEXT CHECK (role IN ('owner', 'admin', 'editor', 'viewer'))
- created_at TIMESTAMPTZ DEFAULT NOW()
- UNIQUE(album_id, user_id)

### photos (originals)
- id TEXT PRIMARY KEY
- album_id TEXT NOT NULL
- user_id TEXT NOT NULL (uploader)
- storage_key TEXT NOT NULL (R2/S3)
- filename TEXT
- mime_type TEXT
- size_bytes INTEGER
- status TEXT CHECK (status IN ('uploaded', 'processing', 'ready', 'error'))
- created_at TIMESTAMPTZ DEFAULT NOW()

### generated_photos (themed variants)
- id TEXT PRIMARY KEY
- original_photo_id TEXT NOT NULL
- theme_id TEXT NOT NULL
- storage_key TEXT NOT NULL
- status TEXT CHECK (status IN ('queued', 'processing', 'completed', 'error'))
- credits_used INTEGER DEFAULT 0
- created_at TIMESTAMPTZ DEFAULT NOW()
- completed_at TIMESTAMPTZ

### themes
- id TEXT PRIMARY KEY
- group_id TEXT NOT NULL (immutable versioning)
- name TEXT NOT NULL
- description TEXT
- css_tokens JSONB (custom properties)
- prompt_template TEXT (for OpenAI)
- is_public BOOLEAN DEFAULT false
- user_id TEXT (null = system themes)
- status TEXT CHECK (status IN ('staged', 'confirmed', 'deleted'))
- created_at TIMESTAMPTZ DEFAULT NOW()
- confirmed_at TIMESTAMPTZ

### credits
- id TEXT PRIMARY KEY
- user_id TEXT NOT NULL
- balance INTEGER NOT NULL DEFAULT 0
- created_at TIMESTAMPTZ DEFAULT NOW()
- updated_at TIMESTAMPTZ DEFAULT NOW()

### credit_transactions
- id TEXT PRIMARY KEY
- user_id TEXT NOT NULL
- amount INTEGER NOT NULL (positive = add, negative = deduct)
- type TEXT CHECK (type IN ('purchase', 'usage', 'refund', 'bonus'))
- description TEXT
- related_entity_type TEXT (photo, album, etc.)
- related_entity_id TEXT
- created_at TIMESTAMPTZ DEFAULT NOW()

## Project Structure

```
redrawn/
├── api/
│   ├── cmd/
│   │   ├── api/
│   │   │   └── main.go
│   │   └── seed/
│   │       └── main.go
│   ├── internal/
│   │   ├── app/
│   │   │   ├── app.go
│   │   │   └── context.go
│   │   ├── config/
│   │   │   └── config.go
│   │   ├── gen/              # Generated Jet types (NEVER EDIT)
│   │   ├── handlers/
│   │   │   ├── albums.go
│   │   │   ├── auth.go
│   │   │   ├── billing.go
│   │   │   ├── health.go
│   │   │   ├── photos.go
│   │   │   ├── public.go
│   │   │   ├── themes.go
│   │   │   └── users.go
│   │   ├── middleware/
│   │   │   ├── auth.go
│   │   │   └── logger.go
│   │   └── services/
│   │       ├── albums.go
│   │       ├── auth.go
│   │       ├── billing.go
│   │       ├── photos.go
│   │       ├── public.go
│   │       ├── themes.go
│   │       └── users.go
│   ├── go.mod
│   └── openapi.json          # Generated
├── db/
│   └── migrations/
│       ├── 001_initial_schema.sql
│       └── ...
├── web/
│   ├── pages/                # Next.js Pages Router
│   ├── src/
│   │   ├── components/
│   │   │   └── ui/           # shadcn components
│   │   ├── services/
│   │   │   ├── emptyApi.ts   # Base RTK Query
│   │   │   └── genApi.ts     # Generated (NEVER EDIT)
│   │   └── lib/
│   │       └── utils.ts
│   ├── package.json
│   └── tsconfig.json
├── docker-compose.yml
├── Makefile
├── README.md
└── .env.example
```

## Implementation Phases

### Phase 1: Foundation
- [ ] Makefile with all standard targets (db-up, api, web, migrate-up, jet-gen, etc.)
- [ ] docker-compose.yml for Postgres
- [ ] Database migrations (001_initial_schema.sql)
- [ ] Go API skeleton with Fuego
- [ ] Next.js skeleton with RTK Query setup

### Phase 2: Auth & Users
- [ ] User registration/login
- [ ] Session management
- [ ] Google OAuth (optional for now)

### Phase 3: Albums & Collaboration
- [ ] CRUD albums with immutable versioning
- [ ] Album members/roles
- [ ] Public album pages with optional password

### Phase 4: Photos & Generation
- [ ] Upload originals to R2
- [ ] Theme system
- [ ] Background job queue for image generation (River or custom)
- [ ] Generated photo variants

### Phase 5: Billing
- [ ] Credit system
- [ ] Stripe checkout
- [ ] Credit usage tracking

## Stack Decisions

| Component | Choice |
|-----------|--------|
| Backend | Go + Fuego + Jet SQL |
| Database | PostgreSQL + dbmate |
| Frontend | Next.js + RTK Query + Tailwind + Bun |
| Background Jobs | River (already in autobok pattern) |
| Storage | R2/S3 compatible |
| Auth | Session-based (start simple) |
| Payments | Stripe |

## Critical Rules from Autobok

1. **Never raw SQL** - Always use Jet SQL
2. **Immutable versioning** - All entities use group_id pattern
3. **make lint must pass** - 0 issues before commit
4. **Integration tests** - Every SQL method tested
5. **Plan approval** - Wait for explicit yes before implementing

---

**Status:** 📝 IN DISCUSSION

Do you approve this plan? Any changes before I start implementing?
