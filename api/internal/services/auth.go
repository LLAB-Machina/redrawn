package services

import (
	"context"
	"errors"

	"redrawn/api/ent/user"
	"redrawn/api/internal/app"

	"github.com/google/uuid"
)

type AuthService struct {
	app *app.App
}

func NewAuthService(a *app.App) *AuthService { return &AuthService{app: a} }

func (s *AuthService) RequestMagicLink(ctx context.Context, email string) error {
	// For MVP: create or get user; in real life, send magic link email
	_, err := s.ensureUser(ctx, email)
	return err
}

func (s *AuthService) Verify(ctx context.Context, token string) error {
	// For MVP: accept token as email and set context user (middleware should set cookie)
	_, err := s.ensureUser(ctx, token)
	return err
}

func (s *AuthService) Logout(ctx context.Context) error {
	return nil
}

func (s *AuthService) ensureUser(ctx context.Context, email string) (string, error) {
	if email == "" {
		return "", errors.New("email required")
	}
	u, err := s.app.Ent.User.Query().Where(user.EmailEQ(email)).Only(ctx)
	if err == nil {
		return u.ID.String(), nil
	}
	// create
	handle := email
	nu, err := s.app.Ent.User.Create().SetID(uuid.New()).SetEmail(email).SetHandle(handle).Save(ctx)
	if err != nil {
		return "", err
	}
	return nu.ID.String(), nil
}
