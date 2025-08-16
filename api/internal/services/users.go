package services

import (
	"context"
	"errors"

	"redrawn/api/internal/api"
	"redrawn/api/internal/app"
)

type UsersService struct {
	app *app.App
}

func NewUsersService(a *app.App) *UsersService { return &UsersService{app: a} }

func (s *UsersService) GetMe(ctx context.Context) (api.User, error) {
	uid, ok := app.UserIDFromContext(ctx)
	if !ok {
		return api.User{}, errors.New("unauthorized")
	}
	u, err := s.app.Ent.User.Get(ctx, uid)
	if err != nil {
		return api.User{}, err
	}
	return api.User{ID: u.ID, Email: u.Email, Name: u.Name, Plan: u.Plan, Credits: u.Credits}, nil
}

func (s *UsersService) PatchMe(ctx context.Context, name *string) error {
	uid, ok := app.UserIDFromContext(ctx)
	if !ok {
		return errors.New("unauthorized")
	}
	m := s.app.Ent.User.UpdateOneID(uid)
	if name != nil {
		m.SetName(*name)
	}
	return m.Exec(ctx)
}
