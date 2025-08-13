package queue

import (
	"context"
	"log/slog"
	"time"

	"redrawn/api/ent"
	"redrawn/api/ent/job"

	"github.com/google/uuid"
)

// DBQueue implements a Postgres-backed persistent queue using Ent.
type DBQueue struct {
	client    *ent.Client
	processor func(context.Context, map[string]any) error
	pollEvery time.Duration
	workers   int
	stopCh    chan struct{}
}

func NewDB(client *ent.Client, pollEvery time.Duration, workers int, processor func(context.Context, map[string]any) error) *DBQueue {
	if pollEvery <= 0 {
		pollEvery = 500 * time.Millisecond
	}
	if workers <= 0 {
		workers = 1
	}
	return &DBQueue{client: client, processor: processor, pollEvery: pollEvery, workers: workers, stopCh: make(chan struct{})}
}

func (q *DBQueue) Enqueue(ctx context.Context, taskType string, payload map[string]any) (string, error) {
	j, err := q.client.Job.Create().SetType(taskType).SetPayload(payload).SetStatus(job.StatusQueued).Save(ctx)
	if err != nil {
		return "", err
	}
	return j.ID.String(), nil
}

func (q *DBQueue) Get(taskID string) (map[string]any, bool) {
	id, err := uuid.Parse(taskID)
	if err != nil {
		return nil, false
	}
	j, err := q.client.Job.Get(context.Background(), id)
	if err != nil {
		return nil, false
	}
	return map[string]any{
		"id":     j.ID.String(),
		"type":   j.Type,
		"status": string(j.Status),
		"error": func() string {
			if j.Error == nil {
				return ""
			}
			return *j.Error
		}(),
	}, true
}

func (q *DBQueue) Run(ctx context.Context) {
	for i := 0; i < q.workers; i++ {
		go q.worker(ctx, i)
	}
}

func (q *DBQueue) worker(ctx context.Context, idx int) {
	logger := slog.With(slog.String("component", "dbworker"), slog.Int("worker", idx))
	ticker := time.NewTicker(q.pollEvery)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-q.stopCh:
			return
		case <-ticker.C:
			if err := q.processOne(ctx, logger); err != nil {
				logger.Error("process job error", slog.String("err", err.Error()))
			}
		}
	}
}

func (q *DBQueue) processOne(ctx context.Context, logger *slog.Logger) error {
	tx, err := q.client.Tx(ctx)
	if err != nil {
		return err
	}
	// Lock next queued job FOR UPDATE SKIP LOCKED
	j, err := tx.Job.Query().
		Where(job.StatusEQ(job.StatusQueued)).
		Order(ent.Asc(job.FieldEnqueuedAt)).
		First(ctx)
	if err != nil {
		_ = tx.Rollback()
		return nil
	}
	now := time.Now()
	if err := tx.Job.UpdateOneID(j.ID).SetStatus(job.StatusRunning).SetStartedAt(now).Exec(ctx); err != nil {
		_ = tx.Rollback()
		return err
	}
	if err := tx.Commit(); err != nil {
		return err
	}

	// Process outside the transaction
	perr := q.processor(ctx, j.Payload)
	tx2, _ := q.client.Tx(ctx)
	if perr != nil {
		msg := perr.Error()
		if err := tx2.Job.UpdateOneID(j.ID).SetStatus(job.StatusFailed).SetError(msg).SetCompletedAt(time.Now()).Exec(ctx); err != nil {
			_ = tx2.Rollback()
			return err
		}
		return tx2.Commit()
	}
	if err := tx2.Job.UpdateOneID(j.ID).SetStatus(job.StatusSucceeded).SetCompletedAt(time.Now()).ClearError().Exec(ctx); err != nil {
		_ = tx2.Rollback()
		return err
	}
	return tx2.Commit()
}

func (q *DBQueue) Shutdown(context.Context) { close(q.stopCh) }
