package main

import (
	"context"
	"strconv"

	"redrawn/api/internal/api"
	"redrawn/api/internal/app"

	"github.com/jackc/pgx/v5"
	"github.com/riverqueue/river"
	"github.com/riverqueue/river/rivertype"
)

// riverAdapter implements app.TaskQueue over a River client.
type riverAdapter struct{ c *river.Client[pgx.Tx] }

var _ app.TaskQueue = (*riverAdapter)(nil)

func newRiverAdapter(c *river.Client[pgx.Tx]) *riverAdapter { return &riverAdapter{c: c} }

func (r *riverAdapter) EnqueueGenerate(ctx context.Context, payload api.GenerateJobPayload) (string, error) {
	// Limit to 3 attempts for generate jobs
	res, err := r.c.Insert(ctx, payload, &river.InsertOpts{MaxAttempts: 3})
	if err != nil {
		return "", err
	}
	return strconv.FormatInt(res.Job.ID, 10), nil
}

func (r *riverAdapter) GetStatus(taskID string) (string, bool) {
	// River IDs are int64; allow numeric strings
	var idInt64 int64
	if v, err := strconv.ParseInt(taskID, 10, 64); err == nil {
		idInt64 = v
	} else {
		// Not a valid River ID
		return "", false
	}
	job, err := r.c.JobGet(context.Background(), idInt64)
	if err != nil || job == nil {
		return "", false
	}
	// Map River states roughly to our public statuses
	switch job.State {
	case rivertype.JobStateAvailable, rivertype.JobStateScheduled:
		return "queued", true
	case rivertype.JobStateRunning:
		return "running", true
	case rivertype.JobStateCompleted:
		return "succeeded", true
	case rivertype.JobStateCancelled:
		return "failed", true
	default:
		return string(job.State), true
	}
}
