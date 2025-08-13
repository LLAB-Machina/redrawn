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

.PHONY: dev api web migrate-diff migrate-apply lint test docker-up docker-down db-up db-down install openapi generate-clients reset-db uphead init-env compose-dev-up compose-dev-down compose-prod-up compose-prod-down

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
	$$BREW_CMD install go node golangci-lint ariga/tap/atlas || true
	@echo "Installing air (Go live reload)..."; \
	cd api && GO111MODULE=on GOBIN=$$(${SHELL} -lc 'go env GOPATH')/bin go install github.com/air-verse/air@latest || true
	@echo "Installing Go module dependencies..."
	cd api && go mod download
	@echo "Installing web dependencies (npm i)..."
	cd web && npm i
	$(MAKE) init-env
	@echo "Done. You can now run: 'docker compose up -d postgres' and then 'make dev'"

init-env: ## Create a .env file with local defaults if missing
	@if [ -s .env ]; then \
		echo ".env already exists and is non-empty. Skipping creation."; \
	else \
		echo "Creating .env with local development defaults..."; \
		printf "%s\n" \
		"DATABASE_URL=postgres://redrawn:redrawn@localhost:5432/redrawn?sslmode=disable" \
		"SESSION_SECRET=dev_session_secret" \
		"PUBLIC_BASE_URL=http://localhost" \
		"" \
		"# Cloudflare Images (dev placeholders)" \
		"CF_ACCOUNT_ID=dev_cf_account" \
		"CF_IMAGES_TOKEN=dev_cf_images_token" \
		"CF_IMAGES_DELIVERY_HASH=dev_cf_delivery_hash" \
		"" \
		"# Stripe (dev placeholders)" \
		"STRIPE_SECRET_KEY=sk_test_xxx" \
		"STRIPE_WEBHOOK_SECRET=whsec_test_xxx" \
		"STRIPE_PRICE_ID=price_test_xxx" \
		"" \
		"# OpenAI (dev placeholder)" \
		"OPENAI_API_KEY=sk-openai-test" \
		"" \
		"# Credits per billing cycle (default)" \
		"CREDITS_PER_CYCLE=1000" \
		"" \
		"# Frontend base URL to the API" \
		"NEXT_PUBLIC_API_BASE_URL=http://localhost:8080" \
		> .env; \
		echo ".env created."; \
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

reset-db: ## Drop and recreate DB schema, then apply migrations (DANGER)
	@if [ -z "$(DATABASE_URL)" ]; then echo "DATABASE_URL not set (set it in .env or environment)"; exit 1; fi
	@echo "Resetting database..."
	atlas schema apply --env local --url '$(DATABASE_URL)' --to "{}" --auto-approve || true
	atlas migrate apply --env local --dir file://migrations --url '$(DATABASE_URL)'

openapi: ## Generate OpenAPI JSON into api/openapi.json without running server
	cd api && go run ./cmd/api --openapi-only > openapi.json

generate-clients: openapi ## Generate web RTK Query client from OpenAPI
	cd web && npx --yes @rtk-query/codegen-openapi rtk.codegen.cjs

