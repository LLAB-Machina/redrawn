package app

import (
	"context"
	"redrawn/api/ent"
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
	Enqueue(ctx context.Context, taskType string, payload map[string]any) (string, error)
	Get(taskID string) (map[string]any, bool)
}
