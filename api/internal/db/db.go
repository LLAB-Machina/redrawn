package db

import (
	"context"
	"fmt"
	"os"

	"redrawn/api/ent"

	_ "github.com/lib/pq"
)

// Open returns an Ent client using DATABASE_URL.
// Driver: lib/pq (imported via go.mod) with DSN postgres://...
func Open(_ context.Context) (*ent.Client, error) {
	url := os.Getenv("DATABASE_URL")
	if url == "" {
		return nil, fmt.Errorf("DATABASE_URL is required")
	}
	return ent.Open("postgres", url)
}
