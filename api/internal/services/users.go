package services

import (
	"context"

	"redrawn/api/internal/api"
	"redrawn/api/internal/app"
	"redrawn/api/internal/errorsx"
	"redrawn/api/internal/generated"
)

type UsersService struct {
	app *app.App
}

func NewUsersService(a *app.App) *UsersService { return &UsersService{app: a} }

func (s *UsersService) GetMe(ctx context.Context) (api.User, error) {
	uid, ok := app.UserIDFromContext(ctx)
	if !ok {
		return api.User{}, errorsx.ErrUnauthorized
	}
	u, err := s.app.Db.User.Get(ctx, uid)
	if err != nil {
		if generated.IsNotFound(err) {
			return api.User{}, errorsx.ErrNotFound
		}
		return api.User{}, err
	}
	return api.User{ID: u.ID, Email: u.Email, Name: u.Name, Plan: u.Plan, Credits: u.Credits}, nil
}

func (s *UsersService) PatchMe(ctx context.Context, name *string) error {
	uid, ok := app.UserIDFromContext(ctx)
	if !ok {
		return errorsx.ErrUnauthorized
	}
	m := s.app.Db.User.UpdateOneID(uid)
	if name != nil {
		m.SetName(*name)
	}
	return m.Exec(ctx)
}
