package handlers

import (
	"context"
	"errors"

	"redrawn/api/internal/api"
	"redrawn/api/internal/app"
	"redrawn/api/internal/services"

	"github.com/go-fuego/fuego"
	"github.com/google/uuid"
)

func RegisterAdmin(s *fuego.Server, a *app.App) {
	svc := services.NewAdminService(a)

	// Helper function to check admin access
	checkAdminAuth := func(ctx context.Context) error {
		userID, ok := app.UserIDFromContext(ctx)
		if !ok {
			return fuego.UnauthorizedError{Err: errors.New("authentication required")}
		}

		userUUID, err := uuid.Parse(userID)
		if err != nil {
			return fuego.UnauthorizedError{Err: errors.New("invalid user ID")}
		}

		user, err := a.Ent.User.Get(ctx, userUUID)
		if err != nil {
			return fuego.UnauthorizedError{Err: errors.New("user not found")}
		}

		if !svc.IsAdmin(user.Email) {
			return fuego.ForbiddenError{Err: errors.New("admin access required")}
		}

		return nil
	}

	// Price management
	fuego.Get(s, "/v1/admin/prices", func(c fuego.ContextNoBody) ([]api.Price, error) {
		if err := checkAdminAuth(c.Context()); err != nil {
			return nil, err
		}
		return svc.ListAllPrices(c.Context())
	})

	fuego.Post(s, "/v1/admin/prices", func(c fuego.ContextWithBody[api.CreatePriceRequest]) (*api.Price, error) {
		if err := checkAdminAuth(c.Context()); err != nil {
			return nil, err
		}
		body, err := c.Body()
		if err != nil {
			return nil, err
		}
		return svc.CreatePrice(c.Context(), body)
	})

	fuego.Put(s, "/v1/admin/prices/{id}", func(c fuego.ContextWithBody[api.UpdatePriceRequest]) (*api.Price, error) {
		if err := checkAdminAuth(c.Context()); err != nil {
			return nil, err
		}
		priceID := c.Request().PathValue("id")
		body, err := c.Body()
		if err != nil {
			return nil, err
		}
		return svc.UpdatePrice(c.Context(), priceID, body)
	})

	fuego.Delete(s, "/v1/admin/prices/{id}", func(c fuego.ContextNoBody) (api.OkResponse, error) {
		if err := checkAdminAuth(c.Context()); err != nil {
			return api.OkResponse{}, err
		}
		priceID := c.Request().PathValue("id")
		err := svc.DeletePrice(c.Context(), priceID)
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
		return svc.ListAllUsers(c.Context())
	})

	// Album management
	fuego.Get(s, "/v1/admin/albums", func(c fuego.ContextNoBody) ([]api.AdminAlbum, error) {
		if err := checkAdminAuth(c.Context()); err != nil {
			return nil, err
		}
		return svc.ListAllAlbums(c.Context())
	})
}
