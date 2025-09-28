SHELL := /bin/sh

# Auto-load variables from .env if present
ENV_FILE ?= .env
ifneq (,$(wildcard $(ENV_FILE)))
include $(ENV_FILE)
export $(shell sed -n 's/^[[:space:]]*\([A-Za-z_][A-Za-z0-9_]*\)[[:space:]]*=.*/\1/p' $(ENV_FILE))
endif

.PHONY: help setup setup-all

help: ## Show available make targets
	@echo "\033[1;36mAvailable targets:\033[0m"
	@echo ""
	@awk 'BEGIN {FS = ":.*##"} /^[a-zA-Z0-9_.-]+:.*##/ {printf "\033[1;32m%-18s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)


setup: ## Complete setup guide for new developers
	@echo "🚀 Redrawn Setup Guide"
	@echo "====================="
	@echo ""
	@echo "This will guide you through setting up the complete development environment."
	@echo ""
	@echo "Step 1: Install dependencies (Go, Node, Atlas, etc.)"
	@echo "  Run: make install"
	@echo ""
	@echo "Step 2: Create environment file"
	@echo "  Run: make init-env"
	@echo "  Then edit .env with your credentials (see docs/SETUP.md for details)"
	@echo ""
	@echo "Step 3: Start PostgreSQL"
	@echo "  Run: make db-up"
	@echo ""
	@echo "Step 4: Apply database migrations"
	@echo "  Run: make uphead"
	@echo "  Run: make river-up"
	@echo ""
	@echo "Step 5: Seed initial data"
	@echo "  Run: make seed-db"
	@echo ""
	@echo "Step 6: Start services"
	@echo "  Run: make api    (in one terminal)"
	@echo "  Run: make web    (in another terminal)"
	@echo ""
	@echo "🎉 Then visit http://localhost:3000"
	@echo ""
	@echo "📚 For detailed credential setup, see docs/SETUP.md"
	@echo "💡 Run 'make help' to see all available commands"
	@echo "💡 Run 'make setup-all' to automatically run all setup steps"

setup-all: ## Automatically run complete setup from scratch (install, env, db, migrations, seed)
	@echo "🚀 Running complete automated setup..."
	@echo ""
	@echo "Step 1/6: Installing dependencies..."
	$(MAKE) install
	@echo ""
	@echo "Step 2/6: Creating environment file..."
	$(MAKE) init-env
	@echo ""
	@echo "⚠️  IMPORTANT: Edit .env with your credentials before continuing!"
	@echo "   See docs/SETUP.md for credential setup details."
	@echo ""
	@echo "Step 3/6: Starting PostgreSQL..."
	$(MAKE) db-up
	@echo "Waiting for PostgreSQL to start..."
	@echo "Press Enter to continue..."
	@read dummy
	@echo ""
	@echo "Step 4/6: Applying database migrations..."
	$(MAKE) migrations-fresh
	@echo ""
	@echo "Step 5/6: Applying River migrations..."
	$(MAKE) river-up
	@echo ""
	@echo "Step 6/6: Seeding initial data..."
	$(MAKE) seed-db
	@echo ""
	@echo "✅ Setup complete! Now start the services:"
	@echo "   Terminal 1: make api"
	@echo "   Terminal 2: make web"
	@echo ""
	@echo "🎉 Then visit http://localhost:3000"

.PHONY: api web migrate-diff migrate-apply lint test docker-up docker-down db-up db-down install install-git-hooks openapi generate-clients ent-gen code-gen reset-db uphead init-env compose-dev-up compose-dev-down compose-prod-up compose-prod-down format build-api local-stripe local-stripe-trigger seed-db grant-credits river-up river-down river-list setup setup-all

api: ## Run API locally (requires Postgres running via docker compose)
	@AIR_BIN=$$(go env GOPATH)/bin/air; \
	if [ -x "$$AIR_BIN" ]; then \
		( cd api && "$$AIR_BIN" ); \
	else \
		echo "cosmtrek/air not found; falling back to go run"; \
		( cd api && go run ./cmd/api ); \
	fi

web: ## Run Next.js dev server
	cd web && npm run dev

web-build: ## Build Next.js as static export (fully static)
	cd web && npm run build


lint: ## Lint Go and Web projects
	cd api && golangci-lint run ./...
	cd web && npm run lint

tsc:
	cd web && npm run tsc

test: ## Run Go and Web test suites
	cd api && go test ./... -count=1

docker-up: ## docker compose up for dev file
	docker compose up -d --build

docker-down: ## docker compose down for dev file
	docker compose down

prod-up: ## docker compose up for prod file
	docker compose -f docker-compose.prod.yml up -d --build

prod-down: ## docker compose down for prod file
	docker compose -f docker-compose.prod.yml down

install: ## Install Go, Atlas, Node, and other local dev deps (macOS/Debian/Ubuntu)
	@OS=$$(uname -s); \
	echo "Detected OS: $$OS"; \
	if [ "$$OS" = "Darwin" ]; then \
		./install-mac.sh; \
	elif [ "$$OS" = "Linux" ]; then \
		./install-linux.sh; \
	else \
		echo "Unsupported OS: $$OS. This target supports Linux and macOS only."; \
		exit 1; \
	fi
	@echo "Installing Go tools..."
	@echo "Installing river CLI..."; \
	GOBIN=$$(go env GOPATH)/bin go install github.com/riverqueue/river/cmd/river@latest || true
	@echo "Installing air (Go live reload)..."; \
	cd api && GOBIN=$$(go env GOPATH)/bin go install github.com/air-verse/air@latest || true
	@echo "Installing Go module dependencies..."
	cd api && go mod download
	@echo "Installing web dependencies (npm i)..."
	cd web && npm i
	$(MAKE) init-env
	$(MAKE) install-git-hooks
	@echo "Done. You can now run: 'docker compose up -d postgres' and then 'make dev'"


install-git-hooks: ## Install Git pre-push hook
	@echo "Installing Git pre-push hook..."
	@HOOK_DIR=.git/hooks; HOOK_PATH=$$HOOK_DIR/pre-push; \
		if [ -d .git ]; then \
			mkdir -p $$HOOK_DIR; \
			( \
			  echo "#!/bin/sh"; \
			  echo "set -e"; \
			  echo 'REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"'; \
			  echo 'cd "$$REPO_ROOT"'; \
			  echo "echo '[pre-push] Running make revision'"; \
			  echo "make revision"; \
			  echo "echo '[pre-push] Running make code-gen'"; \
			  echo "make code-gen"; \
			  echo "echo '[pre-push] Running make lint'"; \
			  echo "make lint"; \
			  echo "echo '[pre-push] Running make tsc'"; \
			  echo "make tsc"; \
			  echo "echo '[pre-push] Running make format'"; \
			  echo "make format"; \
			  echo "echo '[pre-push] Building Go API'"; \
			  echo "make build-api"; \
			) > $$HOOK_PATH; \
			chmod +x $$HOOK_PATH; \
			echo "Git pre-push hook installed at $$HOOK_PATH"; \
		else \
			echo "No .git directory found; skipping Git hook installation."; \
		fi

init-env: ## Create .env by copying .env.example if missing
	@if [ -s .env ]; then \
		echo ".env already exists and is non-empty. Skipping creation."; \
	else \
		if [ -f .env.example ]; then \
			cp .env.example .env; \
			echo ".env created from .env.example"; \
		else \
			echo ".env.example not found. Please create it with your local defaults."; \
			exit 1; \
		fi; \
	fi

db-up: ## Start only Postgres via docker compose (dev)
	docker compose up -d postgres

db-down: ## Stop only Postgres via docker compose (dev)
	docker compose stop postgres

revision: ## Generate Atlas migration from Ent schemas
	cd api && atlas migrate diff -c file://../atlas.hcl --env local --to ent://internal/schema --dir file://../migrations --format '{{ sql . "  " }}'

uphead: ## Apply Atlas migrations
	@if [ -z "$(DATABASE_URL)" ]; then echo "DATABASE_URL not set (set it in .env or environment)"; exit 1; fi
	atlas migrate apply --dir file://migrations --url '$(DATABASE_URL)'

reset-db: ## Force-reset Postgres data (dev), re-apply migrations, then River (DANGER)
	@if [ -z "$(DATABASE_URL)" ]; then echo "DATABASE_URL not set (set it in .env or environment)"; exit 1; fi
	@echo "[reset-db] Stopping postgres (if running)..."
	- docker compose stop postgres >/dev/null 2>&1 || true
	@echo "[reset-db] Removing data directory ./docker-data/postgres (dev volume)..."
	- rm -rf docker-data/postgres || true
	@echo "[reset-db] Starting fresh postgres..."
	 docker compose up -d postgres
	@echo "[reset-db] Waiting for postgres to accept connections..."
	@i=0; \
	until atlas migrate status --dir file://migrations --url '$(DATABASE_URL)' >/dev/null 2>&1; do \
	  i=$$((i+1)); \
	  if [ $$i -ge 20 ]; then echo "[reset-db] Postgres not ready after multiple attempts"; exit 1; fi; \
	  sleep 1; \
	done
	@echo "[reset-db] Applying migrations..."
	atlas migrate apply --dir file://migrations --url '$(DATABASE_URL)'
	@echo "[reset-db] Applying River migrations..."
	$(MAKE) river-up

.PHONY: migrations-fresh db-fresh

migrations-fresh: ## Delete all SQL migrations (keep empty.hcl) and generate fresh from Ent (DANGER)
	@echo "[migrations-fresh] Deleting existing SQL migration files..."
	- find migrations -name '*.sql' -mindepth 1 -maxdepth 1 -print -delete || true
	@echo "[migrations-fresh] Generating new migration from Ent schema..."
	atlas migrate hash
	$(MAKE) revision

# --- River migrations ---

river-up: ## Apply River migrations (idempotent)
	@if ! command -v river >/dev/null 2>&1; then \
		echo "river CLI not found. Run 'make install' to install it."; exit 1; \
	fi
	@if [ -z "$(DATABASE_URL)" ]; then echo "DATABASE_URL not set (set it in .env or environment)"; exit 1; fi
	@# Skip if validate shows no unapplied migrations
	@if river validate --line main --database-url '$(DATABASE_URL)' -v 2>&1 | grep -Fq 'Unapplied migrations: []'; then \
		echo "River migrations already up-to-date; skipping."; \
	else \
		echo "Applying River migrations..."; \
		OUTPUT=$$(river migrate-up --line main --database-url '$(DATABASE_URL)' 2>&1); \
		STATUS=$$?; \
		echo "$$OUTPUT"; \
		if [ $$STATUS -ne 0 ] && echo "$$OUTPUT" | grep -Fq 'relation "river_migration" already exists'; then \
			echo "River control table already exists. Assuming migrations are initialized; skipping."; \
			exit 0; \
		else \
			exit $$STATUS; \
		fi; \
	fi

river-down: ## Downgrade River migrations (destructive; removes River tables)
	@if ! command -v river >/dev/null 2>&1; then \
		echo "river CLI not found. Run 'make install' to install it."; exit 1; \
	fi
	@if [ -z "$(DATABASE_URL)" ]; then echo "DATABASE_URL not set (set it in .env or environment)"; exit 1; fi
	river migrate-down --line main --database-url '$(DATABASE_URL)' --max-steps 100

river-list: ## List River migrations and applied state
	@if ! command -v river >/dev/null 2>&1; then \
		echo "river CLI not found. Run 'make install' to install it."; exit 1; \
	fi
	@if [ -z "$(DATABASE_URL)" ]; then echo "DATABASE_URL not set (set it in .env or environment)"; exit 1; fi
	river migrate-list --line main --database-url '$(DATABASE_URL)'

openapi: ## Generate OpenAPI JSON into api/doc/openapi.json without running server (deterministic order, formatted)
	cd api && go run ./cmd/api --openapi-only | jq -S . > doc/openapi.json
	cd web && npx prettier --write ../api/doc/openapi.json

generate-clients: openapi ## Generate web RTK Query client from OpenAPI
	cd web && npx --yes @rtk-query/codegen-openapi rtk.codegen.cjs

ent-gen: ## Generate Ent ORM code from schema
	cd api && go generate ./internal/generated

code-gen: ent-gen generate-clients ## Generate Ent, OpenAPI JSON, and web client
	@true

format: ## Format Go and Web code
	cd api && go fmt ./...
	cd api && find . -type f -name "*.go" -not -path "./internal/generated/*" -print0 | xargs -0 gofumpt -l -w
	cd api && golines -m 100 --ignore-generated -w .
	cd web && npm run format --silent || npx --yes prettier --write .

build-api: ## Build Go API binary
	cd api && mkdir -p bin && go build -o bin/api ./cmd/api

seed-db: ## Seed database with initial data (themes, etc.)
	@if [ -z "$(DATABASE_URL)" ]; then echo "DATABASE_URL not set (set it in .env or environment)"; exit 1; fi
	cd api && go run ./cmd/seed -seed-default-themes

grant-credits: ## Select a user via fzf and grant 10 credits
	@if ! command -v fzf >/dev/null 2>&1; then \
		echo "fzf not found. Install it (e.g., brew install fzf)"; exit 1; \
	fi
	@if [ -z "$(DATABASE_URL)" ]; then echo "DATABASE_URL not set (set it in .env or environment)"; exit 1; fi
	@echo "Fetching users..." >&2
	@USER_LINE=$$(cd api && go run ./cmd/seed -list-users | fzf --with-nth=2,3 --delimiter='\t' --ansi --header='Select user to grant 10 credits' --preview-window=down:3:wrap --preview='echo ID: {1}\\nEmail: {2}\\nName: {3}\\nCredits: {4}'); \
	if [ -z "$$USER_LINE" ]; then echo "No user selected"; exit 1; fi; \
	USER_ID=$$(echo "$$USER_LINE" | awk -F'\t' '{print $$1}'); \
	cd api && go run ./cmd/seed -give-credits -user-id "$$USER_ID" -amount 10

# --- Stripe local helper targets ---

# Usage:
# 1) make local-stripe       -> writes STRIPE_WEBHOOK_SECRET to .env and starts forwarding to our API
# 2) make local-stripe-trigger  -> triggers a simple test event

local-stripe: ## Login (once), capture webhook secret into .env, and start forwarding webhooks to the API
	@if ! command -v stripe >/dev/null 2>&1; then \
		echo "Stripe CLI not found. Install from https://stripe.com/docs/stripe-cli and rerun."; \
		exit 1; \
	fi
	@echo "Ensuring you're logged in (a browser may open)..." && stripe login || true
	@echo "Fetching webhook secret..."; \
	SECRET=$$(stripe listen --print-secret 2>/dev/null); \
	if [ -z "$$SECRET" ]; then \
		echo "Could not fetch webhook secret. Is Stripe CLI logged in?"; exit 1; \
	fi; \
	if [ -f .env ]; then \
		if grep -q '^STRIPE_WEBHOOK_SECRET=' .env; then \
			if [ "$$(uname -s)" = "Darwin" ]; then \
				sed -i '' "s|^STRIPE_WEBHOOK_SECRET=.*|STRIPE_WEBHOOK_SECRET=$$SECRET|" .env; \
			else \
				sed -i "s|^STRIPE_WEBHOOK_SECRET=.*|STRIPE_WEBHOOK_SECRET=$$SECRET|" .env; \
			fi; \
		else \
			echo "STRIPE_WEBHOOK_SECRET=$$SECRET" >> .env; \
		fi; \
	else \
		echo "STRIPE_WEBHOOK_SECRET=$$SECRET" > .env; \
	fi; \
	echo "Saved STRIPE_WEBHOOK_SECRET to .env"; \
	echo "Starting stripe listen → http://localhost:8080/v1/stripe/webhook"; \
	stripe listen --events checkout.session.completed,customer.subscription.created,customer.subscription.updated,customer.subscription.deleted,invoice.payment_succeeded,invoice.payment_failed --forward-to http://localhost:8080/v1/stripe/webhook

local-stripe-trigger: ## Trigger a simple payment event to verify webhook plumbing
	@if ! command -v stripe >/dev/null 2>&1; then \
		echo "Stripe CLI not found. Install from https://stripe.com/docs/stripe-cli"; \
		exit 1; \
	fi
	stripe trigger payment_intent.succeeded

