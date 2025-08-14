package queue

import (
	"context"
	"errors"
	"log/slog"
	"time"

	"redrawn/api/ent"
	"redrawn/api/ent/generatedphoto"
	"redrawn/api/ent/job"
	"redrawn/api/internal/api"

	"github.com/google/uuid"
)

// DBQueue implements a Postgres-backed persistent queue using Ent.
type DBQueue struct {
	client    *ent.Client
	processor func(context.Context, api.GenerateJobPayload) error
	pollEvery time.Duration
	workers   int
	stopCh    chan struct{}
}

func NewDB(client *ent.Client, pollEvery time.Duration, workers int, processor func(context.Context, api.GenerateJobPayload) error) *DBQueue {
	if pollEvery <= 0 {
		pollEvery = 500 * time.Millisecond
	}
	if workers <= 0 {
		workers = 1
	}
	return &DBQueue{client: client, processor: processor, pollEvery: pollEvery, workers: workers, stopCh: make(chan struct{})}
}

func (q *DBQueue) EnqueueGenerate(ctx context.Context, payload api.GenerateJobPayload) (string, error) {
	// Persist as generic JSON map at the storage boundary
	m := map[string]any{"task": payload.Task, "original_id": payload.OriginalID, "theme_id": payload.ThemeID, "generated_id": payload.GeneratedID}
	j, err := q.client.Job.Create().SetType("generate").SetPayload(m).SetStatus(job.StatusQueued).Save(ctx)
	if err != nil {
		return "", err
	}
	return j.ID.String(), nil
}

func (q *DBQueue) GetStatus(taskID string) (string, bool) {
	id, err := uuid.Parse(taskID)
	if err != nil {
		return "", false
	}
	j, err := q.client.Job.Get(context.Background(), id)
	if err != nil {
		return "", false
	}
	return string(j.Status), true
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
			// Sweep any jobs that have exceeded the running timeout
			if n, err := q.sweepTimedOut(ctx); err != nil {
				logger.Error("timeout sweep error", slog.String("err", err.Error()))
			} else if n > 0 {
				logger.Warn("timed out jobs marked", slog.Int("count", n))
			}
			if err := q.processOne(ctx, logger); err != nil {
				logger.Error("process job error", slog.String("err", err.Error()))
			}
		}
	}
}

// sweepTimedOut finds jobs stuck in running state beyond the timeout and marks them failed.
func (q *DBQueue) sweepTimedOut(ctx context.Context) (int, error) {
	const jobTimeout = 2 * time.Minute
	cutoff := time.Now().Add(-jobTimeout)
	// Fetch affected jobs so we can also flip their GeneratedPhoto state
	jobs, err := q.client.Job.Query().
		Where(
			job.StatusEQ(job.StatusRunning),
			job.StartedAtLT(cutoff),
		).
		All(ctx)
	if err != nil {
		return 0, err
	}
	count := 0
	now := time.Now()
	for _, j := range jobs {
		tx, err := q.client.Tx(ctx)
		if err != nil {
			return count, err
		}
		if err := tx.Job.UpdateOneID(j.ID).
			SetStatus(job.StatusFailed).
			SetError("TIMED OUT").
			SetCompletedAt(now).
			Exec(ctx); err != nil {
			_ = tx.Rollback()
			return count, err
		}
		// Also mark the related generated image as failed if we can
		if gidStr, ok := j.Payload["generated_id"].(string); ok && gidStr != "" {
			if gid, err := uuid.Parse(gidStr); err == nil {
				_ = tx.GeneratedPhoto.UpdateOneID(gid).
					SetState(generatedphoto.StateFailed).
					SetErrorMsg("TIMED OUT").
					SetFinishedAt(now).
					Exec(ctx)
			}
		}
		if err := tx.Commit(); err != nil {
			return count, err
		}
		count++
	}
	return count, nil
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
	// Atomically claim the job only if it is still queued. This prevents
	// multiple workers from processing the same job concurrently.
	affected, err := tx.Job.Update().
		Where(job.IDEQ(j.ID), job.StatusEQ(job.StatusQueued)).
		SetStatus(job.StatusRunning).
		SetStartedAt(now).
		Save(ctx)
	if err != nil {
		_ = tx.Rollback()
		return err
	}
	if affected != 1 {
		// Another worker claimed it first.
		_ = tx.Rollback()
		return nil
	}
	if err := tx.Commit(); err != nil {
		return err
	}

	// Process outside the transaction
	// Convert stored map payload into typed payload for the processor
	gp := api.GenerateJobPayload{}
	if t, ok := j.Payload["task"].(string); ok {
		gp.Task = t
	}
	if v, ok := j.Payload["original_id"].(string); ok {
		gp.OriginalID = v
	}
	if v, ok := j.Payload["theme_id"].(string); ok {
		gp.ThemeID = v
	}
	if v, ok := j.Payload["generated_id"].(string); ok {
		gp.GeneratedID = v
	}
	// attach runtime job id for logging
	gp.JobID = j.ID.String()
	// Enforce a hard timeout for job processing
	const jobTimeout = 2 * time.Minute
	procCtx, cancel := context.WithTimeout(ctx, jobTimeout)
	defer cancel()

	perr := q.processor(procCtx, gp)
	tx2, _ := q.client.Tx(ctx)
	if perr != nil {
		// If the job exceeded its deadline, mark as TIMED OUT
		if errors.Is(procCtx.Err(), context.DeadlineExceeded) || errors.Is(perr, context.DeadlineExceeded) {
			// Also flip the generated photo state to failed
			if gid, err := uuid.Parse(gp.GeneratedID); err == nil {
				_ = tx2.GeneratedPhoto.UpdateOneID(gid).
					SetState(generatedphoto.StateFailed).
					SetErrorMsg("TIMED OUT").
					SetFinishedAt(time.Now()).
					Exec(ctx)
			}
			if err := tx2.Job.UpdateOneID(j.ID).SetStatus(job.StatusFailed).SetError("TIMED OUT").SetCompletedAt(time.Now()).Exec(ctx); err != nil {
				_ = tx2.Rollback()
				return err
			}
			return tx2.Commit()
		}
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
