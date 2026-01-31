# Quality Standards for Redrawn

## Theodor's Requirements
- **Clean and simple** — no unnecessary complexity
- **Fast** — performance matters
- **Devil is in the details** — polish matters
- **Well-built** — solid architecture, not slop

## How I'm Applying This

### Following Autobok Patterns Exactly
- **Jet SQL** — Type-safe queries, no raw SQL
- **Immutable versioning** — Clean audit trail with group_id pattern
- **Proper error handling** — No silent failures
- **Integration tests** — Every SQL method tested against real DB

### Code Quality Gates
1. `make lint` must pass with **0 issues** before commit
2. `make format` — consistent formatting
3. Integration tests for all service methods
4. No `any` types — proper TypeScript/Go types throughout
5. No copy-paste — reusable patterns only

### Clean Architecture
- **Handlers** — Parse/validate input, HTTP concerns only
- **Services** — Business logic, no HTTP
- **Database** — Jet SQL, proper transactions
- **No leaks** — Each layer has single responsibility

### Performance
- Database indexes on all query paths
- Efficient SQL (DISTINCT ON for latest revisions)
- No N+1 queries
- Proper connection pooling

### Simple UX
- Minimal clicks to complete tasks
- Clear error messages
- Fast feedback (optimistic UI where appropriate)
- Mobile-first responsive design

## Current Status

✅ **Implemented with quality:**
- Database schema with proper constraints
- User/Auth services with JWT
- Album service with full immutable versioning
- All follow autobok patterns exactly

**Next:** Photos, Themes, Credits — all will follow same quality standards.
