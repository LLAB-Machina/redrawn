package worker

import (
	"context"
	"strconv"

	"github.com/riverqueue/river"

	"redrawn/api/internal/api"
)

// GenerateWorker adapts the existing generate processor to River's Worker interface.
type GenerateWorker struct {
	river.WorkerDefaults[api.GenerateJobPayload]
	processor func(context.Context, api.GenerateJobPayload) error
}

func NewGenerateWorker(
	processor func(context.Context, api.GenerateJobPayload) error,
) *GenerateWorker {
	return &GenerateWorker{processor: processor}
}

func (w *GenerateWorker) Work(ctx context.Context, job *river.Job[api.GenerateJobPayload]) error {
	payload := job.Args
	// Attach River job ID for logging
	payload.JobID = strconv.FormatInt(job.ID, 10)
	return w.processor(ctx, payload)
}
