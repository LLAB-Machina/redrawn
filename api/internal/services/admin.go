package services

import (
	"context"
	"database/sql"
	"fmt"
	"strconv"
	"time"

	"redrawn/api/internal/api"
	"redrawn/api/internal/app"

	"github.com/google/uuid"
)

type AdminService struct{ app *app.App }

func NewAdminService(a *app.App) *AdminService { return &AdminService{app: a} }

// IsAdmin checks if the given email is in the admin list
func (s *AdminService) IsAdmin(email string) bool {
	for _, adminEmail := range s.app.Config.AdminEmails {
		if adminEmail == email {
			return true
		}
	}
	return false
}

// Price management
func (s *AdminService) CreatePrice(ctx context.Context, req api.CreatePriceRequest) (*api.Price, error) {
	price, err := s.app.Ent.Price.Create().
		SetName(req.Name).
		SetStripePriceID(req.StripePriceID).
		SetCredits(req.Credits).
		SetActive(req.Active).
		Save(ctx)
	if err != nil {
		return nil, err
	}

	return &api.Price{
		ID:            price.ID.String(),
		Name:          price.Name,
		StripePriceID: price.StripePriceID,
		Credits:       price.Credits,
		Active:        price.Active,
	}, nil
}

func (s *AdminService) UpdatePrice(ctx context.Context, priceID string, req api.UpdatePriceRequest) (*api.Price, error) {
	id, err := uuid.Parse(priceID)
	if err != nil {
		return nil, fmt.Errorf("invalid price ID: %w", err)
	}

	update := s.app.Ent.Price.UpdateOneID(id)
	if req.Name != nil {
		update.SetName(*req.Name)
	}
	if req.StripePriceID != nil {
		update.SetStripePriceID(*req.StripePriceID)
	}
	if req.Credits != nil {
		update.SetCredits(*req.Credits)
	}
	if req.Active != nil {
		update.SetActive(*req.Active)
	}

	price, err := update.Save(ctx)
	if err != nil {
		return nil, err
	}

	return &api.Price{
		ID:            price.ID.String(),
		Name:          price.Name,
		StripePriceID: price.StripePriceID,
		Credits:       price.Credits,
		Active:        price.Active,
	}, nil
}

func (s *AdminService) DeletePrice(ctx context.Context, priceID string) error {
	id, err := uuid.Parse(priceID)
	if err != nil {
		return fmt.Errorf("invalid price ID: %w", err)
	}

	return s.app.Ent.Price.DeleteOneID(id).Exec(ctx)
}

func (s *AdminService) ListAllPrices(ctx context.Context) ([]api.Price, error) {
	prices, err := s.app.Ent.Price.Query().All(ctx)
	if err != nil {
		return nil, err
	}

	result := make([]api.Price, 0, len(prices))
	for _, p := range prices {
		result = append(result, api.Price{
			ID:            p.ID.String(),
			Name:          p.Name,
			StripePriceID: p.StripePriceID,
			Credits:       p.Credits,
			Active:        p.Active,
		})
	}
	return result, nil
}

// User management
func (s *AdminService) ListAllUsers(ctx context.Context) ([]api.AdminUser, error) {
	users, err := s.app.Ent.User.Query().All(ctx)
	if err != nil {
		return nil, err
	}

	result := make([]api.AdminUser, 0, len(users))
	for _, u := range users {
		result = append(result, api.AdminUser{
			ID:               u.ID.String(),
			Email:            u.Email,
			Name:             u.Name,
			Handle:           u.Handle,
			Plan:             u.Plan,
			Credits:          u.Credits,
			StripeCustomerID: u.StripeCustomerID,
			CreatedAt:        u.CreatedAt.Format("2006-01-02 15:04:05"),
		})
	}
	return result, nil
}

// Album management
func (s *AdminService) ListAllAlbums(ctx context.Context) ([]api.AdminAlbum, error) {
	albums, err := s.app.Ent.Album.Query().
		WithOwner().
		All(ctx)
	if err != nil {
		return nil, err
	}

	result := make([]api.AdminAlbum, 0, len(albums))
	for _, a := range albums {
		ownerEmail := ""
		if a.Edges.Owner != nil {
			ownerEmail = a.Edges.Owner.Email
		}

		result = append(result, api.AdminAlbum{
			ID:         a.ID.String(),
			Name:       a.Name,
			Slug:       a.Slug,
			Visibility: string(a.Visibility),
			OwnerEmail: ownerEmail,
			CreatedAt:  a.CreatedAt.Format("2006-01-02 15:04:05"),
		})
	}
	return result, nil
}

// Jobs
func (s *AdminService) ListJobs(ctx context.Context) ([]api.AdminJob, error) {
	if s.app.PgxPool == nil {
		return []api.AdminJob{}, nil
	}
	const q = `
		SELECT id, kind, state, created_at, attempted_at, finalized_at,
		       CASE WHEN errors IS NULL OR array_length(errors,1) IS NULL THEN ''
		            ELSE (errors[array_length(errors,1)] ->> 'message')
		       END AS err
		FROM river_job
		ORDER BY created_at DESC
		LIMIT 200`
	rows, err := s.app.PgxPool.Query(ctx, q)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := make([]api.AdminJob, 0, 200)
	for rows.Next() {
		var (
			id          int64
			kind        string
			state       string
			createdAt   time.Time
			attemptedAt sql.NullTime
			finalizedAt sql.NullTime
			errMsg      string
		)
		if scanErr := rows.Scan(&id, &kind, &state, &createdAt, &attemptedAt, &finalizedAt, &errMsg); scanErr != nil {
			return nil, scanErr
		}
		status := mapRiverStateToStatus(state)
		var startedStr *string
		var completedStr *string
		if attemptedAt.Valid {
			s := attemptedAt.Time.Format("2006-01-02 15:04:05")
			startedStr = &s
		}
		if finalizedAt.Valid {
			s := finalizedAt.Time.Format("2006-01-02 15:04:05")
			completedStr = &s
		}
		out = append(out, api.AdminJob{
			ID:          strconv.FormatInt(id, 10),
			Type:        kind,
			Status:      status,
			Error:       errMsg,
			EnqueuedAt:  createdAt.Format("2006-01-02 15:04:05"),
			StartedAt:   startedStr,
			CompletedAt: completedStr,
		})
	}
	return out, nil
}

func (s *AdminService) JobSummary(ctx context.Context) (api.AdminJobSummary, error) {
	if s.app.PgxPool == nil {
		return api.AdminJobSummary{}, nil
	}
	const qQueued = `SELECT count(*) FROM river_job WHERE state IN ('available','scheduled','pending','retryable')`
	const qRunning = `SELECT count(*) FROM river_job WHERE state = 'running'`
	const qSucceeded = `SELECT count(*) FROM river_job WHERE state = 'completed'`
	const qFailed = `SELECT count(*) FROM river_job WHERE state IN ('cancelled','discarded')`
	var out api.AdminJobSummary
	if err := s.app.PgxPool.QueryRow(ctx, qQueued).Scan(&out.Queued); err != nil {
		return api.AdminJobSummary{}, err
	}
	if err := s.app.PgxPool.QueryRow(ctx, qRunning).Scan(&out.Running); err != nil {
		return api.AdminJobSummary{}, err
	}
	if err := s.app.PgxPool.QueryRow(ctx, qSucceeded).Scan(&out.Succeeded); err != nil {
		return api.AdminJobSummary{}, err
	}
	if err := s.app.PgxPool.QueryRow(ctx, qFailed).Scan(&out.Failed); err != nil {
		return api.AdminJobSummary{}, err
	}
	return out, nil
}

func mapRiverStateToStatus(state string) string {
	switch state {
	case "available", "scheduled", "pending", "retryable":
		return "queued"
	case "running":
		return "running"
	case "completed":
		return "succeeded"
	case "cancelled", "discarded":
		return "failed"
	default:
		return state
	}
}
