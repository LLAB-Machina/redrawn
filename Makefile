SHELL := /bin/zsh

# Auto-load variables from .env if present
ENV_FILE ?= .env
ifneq (,$(wildcard $(ENV_FILE)))
include $(ENV_FILE)
export $(shell sed -n 's/^[[:space:]]*\([A-Za-z_][A-Za-z0-9_]*\)[[:space:]]*=.*/\1/p' $(ENV_FILE))
endif

.PHONY: help

help: ## Show available make targets
	@awk 'BEGIN {FS = ":.*##"} /^[a-zA-Z0-9_.-]+:.*##/ {printf "%-18s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

.PHONY: dev api web migrate-diff migrate-apply lint test docker-up docker-down db-up db-down install openapi generate-clients ent-gen code-gen reset-db uphead init-env compose-dev-up compose-dev-down compose-prod-up compose-prod-down format build-api local-stripe local-stripe-trigger seed-db grant-credits river-up river-down river-list

dev: ## Run API and Web locally (requires Postgres running via docker compose)
	@AIR_BIN=$$(${SHELL} -lc 'go env GOPATH')/bin/air; \
	if [ -x "$$AIR_BIN" ]; then \
		( cd api && "$$AIR_BIN" ); \
	else \
		echo "cosmtrek/air not found; falling back to go run"; \
		( cd api && go run ./cmd/api ); \
	fi

api: ## Run API only (requires env like DATABASE_URL)
	cd api && go run ./cmd/api

web: ## Run Next.js dev server
	cd web && npm run dev


lint: ## Lint Go and Web projects
	cd api && golangci-lint run ./...
	cd web && npm run lint

test: ## Run Go and Web test suites
	cd api && go test ./...
	cd web && npm test

docker-up: ## docker compose up for dev file
	docker compose up -d --build

docker-down: ## docker compose down for dev file
	docker compose down

prod-up: ## docker compose up for prod file
	docker compose -f docker-compose.prod.yml up -d --build

prod-down: ## docker compose down for prod file
	docker compose -f docker-compose.prod.yml down

install: ## Install Go, Atlas, Node, and other local dev deps (macOS)
	@if [ "$(shell uname -s)" != "Darwin" ]; then \
		echo "This install target currently supports macOS only."; \
		exit 1; \
	fi
	@echo "Checking Homebrew..."
	@BREW_CMD=$$(command -v brew || ( [ -x /opt/homebrew/bin/brew ] && echo /opt/homebrew/bin/brew ) || ( [ -x /usr/local/bin/brew ] && echo /usr/local/bin/brew )); \
	if [ -z "$$BREW_CMD" ]; then \
		echo "Homebrew not found. Installing Homebrew..."; \
		NONINTERACTIVE=1 /bin/bash -c "$$(/usr/bin/curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"; \
		BREW_CMD=$$(command -v brew || ( [ -x /opt/homebrew/bin/brew ] && echo /opt/homebrew/bin/brew ) || ( [ -x /usr/local/bin/brew ] && echo /usr/local/bin/brew )); \
	fi; \
	echo "Using Homebrew at: $$BREW_CMD"; \
	$$BREW_CMD update; \
	$$BREW_CMD install go node golangci-lint jq ariga/tap/atlas || true
	@echo "Installing river CLI..."; \
	GO111MODULE=on GOBIN=$$(${SHELL} -lc 'go env GOPATH')/bin go install github.com/riverqueue/river/cmd/river@latest || true
	@echo "Installing air (Go live reload)..."; \
	cd api && GO111MODULE=on GOBIN=$$(${SHELL} -lc 'go env GOPATH')/bin go install github.com/air-verse/air@latest || true
	@echo "Installing Go module dependencies..."
	cd api && go mod download
	@echo "Installing web dependencies (npm i)..."
	cd web && npm i
	$(MAKE) init-env
	@echo "Done. You can now run: 'docker compose up -d postgres' and then 'make dev'"
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
	cd api && atlas migrate diff -c file://../atlas.hcl --env local --to ent://ent/schema --dir file://../migrations --format '{{ sql . "  " }}'

uphead: ## Apply Atlas migrations
	@if [ -z "$(DATABASE_URL)" ]; then echo "DATABASE_URL not set (set it in .env or environment)"; exit 1; fi
	atlas migrate apply --dir file://migrations --url '$(DATABASE_URL)'
	$(MAKE) river-up

reset-db: ## Drop and recreate DB schema, then apply migrations (DANGER)
	@if [ -z "$(DATABASE_URL)" ]; then echo "DATABASE_URL not set (set it in .env or environment)"; exit 1; fi
	@echo "Resetting database..."
	# Force to an empty state (no tables) using an empty HCL, then re-apply migrations
	atlas schema apply --url '$(DATABASE_URL)' --to file://migrations/empty.hcl --auto-approve
	atlas migrate apply --dir file://migrations --url '$(DATABASE_URL)'
	$(MAKE) river-up

# --- River migrations ---

river-up: ## Apply River migrations (idempotent)
	@if ! command -v river >/dev/null 2>&1; then \
		echo "river CLI not found. Run 'make install' to install it."; exit 1; \
	fi
	@if [ -z "$(DATABASE_URL)" ]; then echo "DATABASE_URL not set (set it in .env or environment)"; exit 1; fi
	river migrate-up --line main --database-url '$(DATABASE_URL)'

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

openapi: ## Generate OpenAPI JSON into api/openapi.json without running server (stable key order)
	cd api && go run ./cmd/api --openapi-only | (command -v jq >/dev/null 2>&1 && jq -S . || cat) > openapi.json

generate-clients: openapi ## Generate web RTK Query client from OpenAPI
	cd web && npx --yes @rtk-query/codegen-openapi rtk.codegen.cjs

ent-gen: ## Generate Ent ORM code from schema
	cd api && go generate ./ent

code-gen: ent-gen openapi generate-clients ## Generate Ent, OpenAPI JSON, and web client
	@true

format: ## Format Go and Web code
	cd api && go fmt ./...
	cd web && npm run format --silent || npx --yes prettier --write .

build-api: ## Build Go API binary
	cd api && mkdir -p bin && go build -o bin/api ./cmd/api

seed-db:
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
# 1) make local-stripe       -> writes STRIPE_WEBHOOK to .env and starts forwarding to our API
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
		if grep -q '^STRIPE_WEBHOOK=' .env; then \
			sed -i'' -e "s|^STRIPE_WEBHOOK=.*|STRIPE_WEBHOOK=$$SECRET|" .env; \
		else \
			echo "STRIPE_WEBHOOK=$$SECRET" >> .env; \
		fi; \
	else \
		echo "STRIPE_WEBHOOK=$$SECRET" > .env; \
	fi; \
	echo "Saved STRIPE_WEBHOOK to .env"; \
	echo "Starting stripe listen → http://localhost:8080/v1/stripe/webhook"; \
	stripe listen --events checkout.session.completed,customer.subscription.created,customer.subscription.updated,customer.subscription.deleted,invoice.payment_succeeded,invoice.payment_failed --forward-to http://localhost:8080/v1/stripe/webhook

local-stripe-trigger: ## Trigger a simple payment event to verify webhook plumbing
	@if ! command -v stripe >/dev/null 2>&1; then \
		echo "Stripe CLI not found. Install from https://stripe.com/docs/stripe-cli"; \
		exit 1; \
	fi
	stripe trigger payment_intent.succeeded

