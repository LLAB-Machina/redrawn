package services

import (
	"context"
	"errors"

	"redrawn/api/internal/api"
	"redrawn/api/internal/app"

	"github.com/google/uuid"
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
	uUUID, err := uuid.Parse(uid)
	if err != nil {
		return api.User{}, err
	}
	u, err := s.app.Ent.User.Get(ctx, uUUID)
	if err != nil {
		return api.User{}, err
	}
	return api.User{ID: u.ID.String(), Email: u.Email, Name: u.Name, Handle: u.Handle, Plan: u.Plan, Credits: u.Credits}, nil
}

func (s *UsersService) PatchMe(ctx context.Context, name *string, handle *string) error {
	uid, ok := app.UserIDFromContext(ctx)
	if !ok {
		return errors.New("unauthorized")
	}
	uUUID, err := uuid.Parse(uid)
	if err != nil {
		return err
	}
	m := s.app.Ent.User.UpdateOneID(uUUID)
	if name != nil {
		m.SetName(*name)
	}
	if handle != nil {
		m.SetHandle(*handle)
	}
	return m.Exec(ctx)
}
