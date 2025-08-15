package queue

import (
	"context"
)

// This file previously implemented a custom Postgres queue.
// It's now a thin adapter interface that will be satisfied by the River client configured at startup.

// DBQueue is left in place to avoid widespread refactors; the implementation is now provided at wiring time.
type DBQueue interface {
	EnqueueGenerate(ctx context.Context, payload any) (string, error)
	GetStatus(taskID string) (string, bool)
}
