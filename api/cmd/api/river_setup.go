package main

import (
	"context"

	"redrawn/api/ent"
	"redrawn/api/internal/config"
	"redrawn/api/internal/worker"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/riverqueue/river"
	"github.com/riverqueue/river/riverdriver/riverpgxv5"
)

// setupRiver configures the River client, workers, and returns the client.
func setupRiver(cfg config.Config, entClient *ent.Client) (*river.Client[pgx.Tx], error) {
	pgxPool, err := pgxpool.New(context.Background(), cfg.DatabaseURL)
	if err != nil {
		return nil, err
	}

	workers := river.NewWorkers()
	processor := worker.NewGenerateProcessor(cfg, entClient)
	riverWorker := worker.NewGenerateWorker(processor)
	river.AddWorker(workers, riverWorker)

	riverClient, err := river.NewClient(riverpgxv5.New(pgxPool), &river.Config{
		Queues: map[string]river.QueueConfig{
			river.QueueDefault: {MaxWorkers: 10},
		},
		Workers: workers,
	})
	if err != nil {
		return nil, err
	}
	return riverClient, nil
}
