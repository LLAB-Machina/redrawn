package app

import (
	"context"
	"redrawn/api/ent"
	"redrawn/api/internal/api"
	"redrawn/api/internal/config"
)

// App holds long-lived dependencies for handlers/services.
type App struct {
	Config config.Config
	Ent    *ent.Client
	Queue  TaskQueue
}

// TaskQueue is a minimal interface for enqueuing and querying background tasks.
// It deliberately uses only basic types to avoid cross-package import cycles.
type TaskQueue interface {
	EnqueueGenerate(ctx context.Context, payload api.GenerateJobPayload) (string, error)
	GetStatus(taskID string) (string, bool)
}
