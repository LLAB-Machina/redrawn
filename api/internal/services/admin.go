package services

import (
	"context"
	"fmt"

	"redrawn/api/internal/api"
	"redrawn/api/internal/app"

	"redrawn/api/ent/job"

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
	jobs, err := s.app.Ent.Job.Query().
		Order(job.ByEnqueuedAt()).
		Limit(200).
		All(ctx)
	if err != nil {
		return nil, err
	}
	out := make([]api.AdminJob, 0, len(jobs))
	for _, j := range jobs {
		var started, completed *string
		if j.StartedAt != nil {
			s := j.StartedAt.Format("2006-01-02 15:04:05")
			started = &s
		}
		if j.CompletedAt != nil {
			s := j.CompletedAt.Format("2006-01-02 15:04:05")
			completed = &s
		}
		jobItem := api.AdminJob{
			ID:          j.ID.String(),
			Type:        j.Type,
			Status:      string(j.Status),
			EnqueuedAt:  j.EnqueuedAt.Format("2006-01-02 15:04:05"),
			StartedAt:   started,
			CompletedAt: completed,
		}
		// Map stored JSON payload to typed payload if it matches the generate schema
		if j.Type == "generate" {
			p := api.GenerateJobPayload{}
			if v, ok := j.Payload["task"].(string); ok {
				p.Task = v
			}
			if v, ok := j.Payload["original_id"].(string); ok {
				p.OriginalID = v
			}
			if v, ok := j.Payload["theme_id"].(string); ok {
				p.ThemeID = v
			}
			if v, ok := j.Payload["generated_id"].(string); ok {
				p.GeneratedID = v
			}
			jobItem.Payload = &p
		}
		if j.Error != nil {
			jobItem.Error = *j.Error
		}
		out = append(out, jobItem)
	}
	return out, nil
}

func (s *AdminService) JobSummary(ctx context.Context) (api.AdminJobSummary, error) {
	out := api.AdminJobSummary{}
	type kv struct {
		k string
		v job.Status
	}
	keys := []kv{{"queued", job.StatusQueued}, {"running", job.StatusRunning}, {"succeeded", job.StatusSucceeded}, {"failed", job.StatusFailed}}
	for _, item := range keys {
		n, err := s.app.Ent.Job.Query().Where(job.StatusEQ(item.v)).Count(ctx)
		if err != nil {
			return api.AdminJobSummary{}, err
		}
		switch item.k {
		case "queued":
			out.Queued = n
		case "running":
			out.Running = n
		case "succeeded":
			out.Succeeded = n
		case "failed":
			out.Failed = n
		}
	}
	return out, nil
}
