SHELL := /bin/bash

# Auto-load variables from .env if present
ENV_FILE ?= .env
ifneq (,$(wildcard $(ENV_FILE)))
include $(ENV_FILE)
export $(shell sed -n 's/^[[:space:]]*\([A-Za-z_][A-Za-z0-9_]*\)[[:space:]]*=.*/\1/p' $(ENV_FILE)))
endif

.PHONY: help install init-env db-up db-down migrate-up migrate-down migrate-new migrate-status reset-db api web lint format generate-clients jet-gen openapi build-api build-web test

help: ## Show available make targets
	@echo "\033[1;36mAvailable targets:\033[0m"
	@echo ""
	@awk 'BEGIN {FS = ":.*##"} /^[a-zA-Z0-9_.-]+:.*##/ {printf "\033[1;32m%-18s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# Development
api: ## Run API locally (requires Postgres running)
	@AIR_BIN=$$(${SHELL} -lc 'go env GOPATH')/bin/air; \
	if [ -x "$$AIR_BIN" ]; then \
		( cd api && "$$AIR_BIN" ); \
	else \
		echo "cosmtrek/air not found; falling back to go run"; \
		( cd api && go run ./cmd/api ); \
	fi

web: ## Run Next.js dev server
	cd web && bun run dev

stop: ## Stop all docker compose services
	docker compose down

# Database
db-up: ## Start only Postgres via docker compose (dev)
	docker compose up -d db

db-down: ## Stop only Postgres via docker compose (dev)
	docker compose stop db

read-env: ## Read env from .env
	set -a; source .env; set +a

migrate-new: ## Create a new migration file (usage: make migrate-new name=migration_name)
	@if [ -z "$(name)" ]; then echo "Usage: make migrate-new name=migration_name"; exit 1; fi
	dbmate new "$(name)"

migrate-up: read-env ## Apply all pending migrations
	@if [ -z "$(DATABASE_URL)" ]; then echo "DATABASE_URL not set (set it in .env or environment)"; exit 1; fi
	dbmate up

migrate-down: read-env ## Rollback the last migration
	@if [ -z "$(DATABASE_URL)" ]; then echo "DATABASE_URL not set (set it in .env or environment)"; exit 1; fi
	dbmate down

migrate-status: read-env ## Show migration status
	@if [ -z "$(DATABASE_URL)" ]; then echo "DATABASE_URL not set (set it in .env or environment)"; exit 1; fi
	dbmate status

reset-db: read-env ## Force-reset Postgres data (dev), re-apply migrations (DANGER)
	@if [ -z "$(DATABASE_URL)" ]; then echo "DATABASE_URL not set (set it in .env or environment)"; exit 1; fi
	@echo "[reset-db] Stopping postgres (if running)..."
	- docker compose stop db >/dev/null 2>&1 || true
	@echo "[reset-db] Removing data directory ./docker-data/postgres (dev volume)..."
	- rm -rf docker-data/db || true
	@echo "[reset-db] Starting fresh postgres..."
	docker compose up -d db
	@echo "[reset-db] Waiting for postgres to accept connections..."
	@sleep 3
	@echo "[reset-db] Applying migrations..."
	dbmate up

# Code generation
openapi: ## Generate OpenAPI JSON into api/openapi.json without running server
	cd api && go run ./cmd/api --openapi-only > openapi.json

jet-gen: read-env ## Generate Jet types from database schema
	@if [ -z "$(DATABASE_URL)" ]; then echo "DATABASE_URL not set (set it in .env or environment)"; exit 1; fi
	cd api && jet -dsn="$(DATABASE_URL)" -path=./internal/gen

generate-clients: openapi jet-gen ## Generate web RTK Query client from OpenAPI and Jet types
	cd web && bunx --yes @rtk-query/codegen-openapi rtk.codegen.cjs

# Linting & formatting
lint: ## Lint Go and Web projects
	cd api && golangci-lint run ./...
	cd web && bun run lint
	cd web && bunx --yes tsc --noEmit

format: ## Format Go and Web code
	cd api && go fmt ./...
	cd api && find . -type f -name "*.go" \
		-not -path "./internal/gen/*" \
		-not -path "./_gomodcache/*" \
		-not -path "./_gocache/*" \
		-print0 | xargs -0 gofumpt -l -w 2>/dev/null || true
	cd api && find . -type f -name "*.go" \
		-not -path "./internal/gen/*" \
		-not -path "./_gomodcache/*" \
		-not -path "./_gocache/*" \
		-print0 | xargs -0 golines -m 100 --ignore-generated -w 2>/dev/null || true
	cd web && bun run format --silent || bunx --yes prettier --write .

# Build
build-api: ## Build Go API binary
	cd api && mkdir -p bin && go build -o bin/api ./cmd/api

build-web: ## Build Next.js application
	cd web && bun run build

# Testing
test: ## Run all Go tests
	cd api && go test -v ./...

# Setup
install: ## Install Go, dbmate, Node, and other local dev deps (macOS/Linux)
	@echo "Installing dependencies..."
	@echo "Please ensure Go, Node.js, and Bun are installed"
	@echo "Then run: go install github.com/cosmtrek/air@latest"
	@echo "And: npm install -g dbmate"

init-env: ## Create .env by copying .env.example if missing, generate random secrets
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo "Created .env from .env.example"; \
		echo "Please review and update the values"; \
	else \
		echo ".env already exists"; \
	fi
