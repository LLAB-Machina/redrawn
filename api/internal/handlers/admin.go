package handlers

import (
	"context"
	"errors"
	"os"

	"redrawn/api/internal/api"
	"redrawn/api/internal/app"
	"redrawn/api/internal/services"

	"github.com/go-fuego/fuego"
)

func RegisterAdmin(s *fuego.Server, a *app.App) {
	service := services.NewAdminService(a)

	// Helper function to check admin access
	checkAdminAuth := func(ctx context.Context) error {
		userID, ok := app.UserIDFromContext(ctx)
		if !ok {
			return fuego.UnauthorizedError{Err: errors.New("authentication required")}
		}

		user, err := a.Db.User.Get(ctx, userID)
		if err != nil {
			return fuego.UnauthorizedError{Err: errors.New("user not found")}
		}

		if !service.IsAdmin(user.Email) {
			return fuego.ForbiddenError{Err: errors.New("admin access required")}
		}

		return nil
	}

	// Price management
	fuego.Get(s, "/v1/admin/prices", func(c fuego.ContextNoBody) ([]api.Price, error) {
		if err := checkAdminAuth(c.Context()); err != nil {
			return nil, err
		}
		return service.ListAllPrices(c.Context())
	})

	fuego.Post(
		s,
		"/v1/admin/prices",
		func(c fuego.ContextWithBody[api.CreatePriceRequest]) (*api.Price, error) {
			if err := checkAdminAuth(c.Context()); err != nil {
				return nil, err
			}
			body, err := BindAndValidate(c)
			if err != nil {
				return nil, err
			}
			return service.CreatePrice(c.Context(), body)
		},
	)

	fuego.Put(
		s,
		"/v1/admin/prices/{id}",
		func(c fuego.ContextWithBody[api.UpdatePriceRequest]) (*api.Price, error) {
			if err := checkAdminAuth(c.Context()); err != nil {
				return nil, err
			}
			priceID := c.Request().PathValue("id")
			body, err := BindAndValidate(c)
			if err != nil {
				return nil, err
			}
			return service.UpdatePrice(c.Context(), priceID, body)
		},
	)

	fuego.Delete(s, "/v1/admin/prices/{id}", func(c fuego.ContextNoBody) (api.OkResponse, error) {
		if err := checkAdminAuth(c.Context()); err != nil {
			return api.OkResponse{}, err
		}
		priceID := c.Request().PathValue("id")
		err := service.DeletePrice(c.Context(), priceID)
		if err != nil {
			return api.OkResponse{}, err
		}
		return api.OkResponse{Ok: "true"}, nil
	})

	// User management
	fuego.Get(s, "/v1/admin/users", func(c fuego.ContextNoBody) ([]api.AdminUser, error) {
		if err := checkAdminAuth(c.Context()); err != nil {
			return nil, err
		}
		return service.ListAllUsers(c.Context())
	})

	// Album management
	fuego.Get(s, "/v1/admin/albums", func(c fuego.ContextNoBody) ([]api.AdminAlbum, error) {
		if err := checkAdminAuth(c.Context()); err != nil {
			return nil, err
		}
		return service.ListAllAlbums(c.Context())
	})

	// Jobs management
	fuego.Get(s, "/v1/admin/jobs", func(c fuego.ContextNoBody) ([]api.AdminJob, error) {
		if err := checkAdminAuth(c.Context()); err != nil {
			return nil, err
		}
		return service.ListJobs(c.Context())
	})

	fuego.Get(
		s,
		"/v1/admin/jobs/summary",
		func(c fuego.ContextNoBody) (api.AdminJobSummary, error) {
			if err := checkAdminAuth(c.Context()); err != nil {
				return api.AdminJobSummary{}, err
			}
			return service.JobSummary(c.Context())
		},
	)

	// Job logs endpoint: returns text logs captured by worker for a job
	fuego.Get(
		s,
		"/v1/admin/jobs/{id}/logs",
		func(c fuego.ContextNoBody) (api.JobLogsResponse, error) {
			if err := checkAdminAuth(c.Context()); err != nil {
				return api.JobLogsResponse{}, err
			}
			id := c.PathParam("id")
			// Primary path: logs/jobs/<id>/logs.txt (when API runs with cwd=api)
			// Legacy path: api/logs/jobs/<id>/logs.txt (older runs)
			primary := "logs/jobs/" + id + "/logs.txt"
			legacy := "api/logs/jobs/" + id + "/logs.txt"
			data, err := os.ReadFile(primary)
			if err != nil {
				if b, err2 := os.ReadFile(legacy); err2 == nil {
					return api.JobLogsResponse{Logs: string(b)}, nil
				}
				// If file doesn't exist yet, create empty in the primary path to make it obvious
				_ = os.MkdirAll("logs/jobs/"+id, 0o755)
				_ = os.WriteFile(primary, []byte("(no logs yet)\n"), 0o644)
				data = []byte("(no logs yet)\n")
			}
			return api.JobLogsResponse{Logs: string(data)}, nil
		},
	)
}
