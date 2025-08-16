package river

import (
	"context"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	riverlib "github.com/riverqueue/river"
	"github.com/riverqueue/river/riverdriver/riverpgxv5"

	"redrawn/api/internal/app"
	"redrawn/api/internal/worker"
)

// Setup configures the River client and workers, and returns the client.
func Setup(application *app.App) (*riverlib.Client[pgx.Tx], error) {
	pgxPool, err := pgxpool.New(context.Background(), application.Config.DatabaseURL)
	if err != nil {
		return nil, err
	}

	workers := riverlib.NewWorkers()
	processor := worker.NewGenerateProcessor(
		application.Db,
		application.OpenAI,
		application.Storage,
	)
	riverWorker := worker.NewGenerateWorker(processor)
	riverlib.AddWorker(workers, riverWorker)

	riverClient, err := riverlib.NewClient(riverpgxv5.New(pgxPool), &riverlib.Config{
		Queues: map[string]riverlib.QueueConfig{
			riverlib.QueueDefault: {MaxWorkers: 10},
		},
		Workers: workers,
	})
	if err != nil {
		return nil, err
	}
	return riverClient, nil
}
