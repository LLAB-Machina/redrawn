package app

import (
	"context"
	"database/sql"
	"log/slog"

	"github.com/jackc/pgx/v5"
	"github.com/riverqueue/river"
	stripe "github.com/stripe/stripe-go/v82"

	"redrawn/api/internal/api"
	"redrawn/api/internal/clients/openai"
	"redrawn/api/internal/clients/storage"
	"redrawn/api/internal/config"
	"redrawn/api/internal/generated"
)

// App holds long-lived dependencies for handlers/services.
type App struct {
	Config  config.Config
	Db      *generated.Client
	JetDB   *sql.DB
	Queue   TaskQueue
	River   *river.Client[pgx.Tx]
	OpenAI  openai.Client
	Storage storage.Client
	Stripe  *stripe.Client
}

// TaskQueue is a minimal interface for enqueuing and querying background tasks.
// It deliberately uses only basic types to avoid cross-package import cycles.
type TaskQueue interface {
	EnqueueGenerate(ctx context.Context, payload api.GenerateJobPayload) (string, error)
	GetStatus(taskID string) (string, bool)
}

// Logger returns a request-scoped logger from context if present, or the default.
func Logger(ctx context.Context) *slog.Logger {
	if v := ctx.Value(loggerKey{}); v != nil {
		if lg, ok := v.(*slog.Logger); ok && lg != nil {
			return lg
		}
	}
	return slog.Default()
}

type loggerKey struct{}

// SetLogger attaches a *slog.Logger to context for request-scoped logging.
func SetLogger(ctx context.Context, l *slog.Logger) context.Context {
	return context.WithValue(ctx, loggerKey{}, l)
}
