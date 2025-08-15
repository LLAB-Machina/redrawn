package services

import (
	"context"
	"strconv"

	"redrawn/api/internal/api"
	"redrawn/api/internal/app"

	"github.com/riverqueue/river"
	"github.com/riverqueue/river/rivertype"
)

// QueueService provides typed access to River job queries without SQL.
type QueueService struct{ app *app.App }

func NewQueueService(a *app.App) *QueueService { return &QueueService{app: a} }

// ListJobs returns the most recent jobs with basic fields filled.
func (s *QueueService) ListJobs(ctx context.Context) ([]api.AdminJob, error) {
	if s.app.River == nil {
		return []api.AdminJob{}, nil
	}
	params := river.NewJobListParams().First(200)
	res, err := s.app.River.JobList(ctx, params)
	if err != nil {
		return nil, err
	}
	out := make([]api.AdminJob, 0, len(res.Jobs))
	for _, j := range res.Jobs {
		var startedStr *string
		var completedStr *string
		if j.AttemptedAt != nil {
			s := j.AttemptedAt.Format("2006-01-02 15:04:05")
			startedStr = &s
		}
		if j.FinalizedAt != nil {
			s := j.FinalizedAt.Format("2006-01-02 15:04:05")
			completedStr = &s
		}
		out = append(out, api.AdminJob{
			ID:          strconv.FormatInt(j.ID, 10),
			Type:        j.Kind,
			Status:      string(j.State),
			Error:       "",
			EnqueuedAt:  j.CreatedAt.Format("2006-01-02 15:04:05"),
			StartedAt:   startedStr,
			CompletedAt: completedStr,
		})
	}
	return out, nil
}

// JobSummary aggregates counts across job states by paging over JobList.
func (s *QueueService) JobSummary(ctx context.Context) (api.AdminJobSummary, error) {
	if s.app.River == nil {
		return api.AdminJobSummary{}, nil
	}
	countStates := func(states ...rivertype.JobState) (int, error) {
		pageSize := 500
		params := river.NewJobListParams().States(states...).First(pageSize)
		total := 0
		for {
			res, err := s.app.River.JobList(ctx, params)
			if err != nil {
				return 0, err
			}
			n := len(res.Jobs)
			total += n
			if n < pageSize {
				break
			}
			cursor := river.JobListCursorFromJob(res.Jobs[n-1])
			params = params.After(cursor)
		}
		return total, nil
	}

	var out api.AdminJobSummary
	var err error
	if out.Queued, err = countStates(rivertype.JobStateAvailable, rivertype.JobStateScheduled, rivertype.JobStatePending, rivertype.JobStateRetryable); err != nil {
		return api.AdminJobSummary{}, err
	}
	if out.Running, err = countStates(rivertype.JobStateRunning); err != nil {
		return api.AdminJobSummary{}, err
	}
	if out.Succeeded, err = countStates(rivertype.JobStateCompleted); err != nil {
		return api.AdminJobSummary{}, err
	}
	if out.Failed, err = countStates(rivertype.JobStateCancelled, rivertype.JobStateDiscarded); err != nil {
		return api.AdminJobSummary{}, err
	}
	return out, nil
}
