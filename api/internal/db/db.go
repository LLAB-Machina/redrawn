package db

import (
	"context"
	"database/sql"
	"fmt"
	"os"

	_ "github.com/lib/pq"

	"redrawn/api/internal/generated"
	_ "redrawn/api/internal/generated/runtime"
)

// Open returns an Ent client using DATABASE_URL.
// Driver: lib/pq (imported via go.mod) with DSN postgres://...
func Open(_ context.Context) (*generated.Client, error) {
	url := os.Getenv("DATABASE_URL")
	if url == "" {
		return nil, fmt.Errorf("DATABASE_URL is required")
	}
	return generated.Open("postgres", url)
}

// OpenJet returns a standard sql.DB connection for use with Jet ORM.
func OpenJet(_ context.Context) (*sql.DB, error) {
	url := os.Getenv("DATABASE_URL")
	if url == "" {
		return nil, fmt.Errorf("DATABASE_URL is required")
	}
	return sql.Open("postgres", url)
}
