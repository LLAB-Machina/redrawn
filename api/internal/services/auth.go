package services

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/url"
	"strings"

	"redrawn/api/internal/app"
	"redrawn/api/internal/generated/user"
)

type AuthService struct {
	app *app.App
}

func NewAuthService(a *app.App) *AuthService { return &AuthService{app: a} }

func (s *AuthService) Logout(ctx context.Context) error {
	return nil
}

func (s *AuthService) ensureUser(ctx context.Context, email string) (string, error) {
	if email == "" {
		return "", errors.New("email required")
	}
	u, err := s.app.Db.User.Query().Where(user.EmailEQ(email)).Only(ctx)
	if err == nil {
		return u.ID, nil
	}
	// create with initial credits and defaults (no handle)
	nu, err := s.app.Db.User.Create().
		SetEmail(email).
		SetCredits(10).
		Save(ctx)
	if err != nil {
		return "", err
	}
	return nu.ID, nil
}

// Google OAuth
func (s *AuthService) GoogleStartURL(next string) (string, error) {
	cfg := s.app.Config
	if cfg.PublicBaseURL == "" || cfg.GoogleClientID == "" {
		return "", errors.New("google oauth not configured")
	}
	callback := strings.TrimRight(cfg.PublicBaseURL, "/") + "/v1/auth/google/callback"
	q := url.Values{}
	q.Set("client_id", cfg.GoogleClientID)
	q.Set("redirect_uri", callback)
	q.Set("response_type", "code")
	q.Set("scope", "openid email profile")
	if next != "" {
		q.Set("state", next)
	}
	return "https://accounts.google.com/o/oauth2/v2/auth?" + q.Encode(), nil
}

func (s *AuthService) GoogleVerify(ctx context.Context, code string) (string, error) {
	cfg := s.app.Config
	if cfg.PublicBaseURL == "" || cfg.GoogleClientID == "" || cfg.GoogleClientSecret == "" {
		return "", errors.New("google oauth not configured")
	}
	callback := strings.TrimRight(cfg.PublicBaseURL, "/") + "/v1/auth/google/callback"
	form := url.Values{}
	form.Set("code", code)
	form.Set("client_id", cfg.GoogleClientID)
	form.Set("client_secret", cfg.GoogleClientSecret)
	form.Set("redirect_uri", callback)
	form.Set("grant_type", "authorization_code")
	req, _ := http.NewRequestWithContext(
		ctx,
		http.MethodPost,
		"https://oauth2.googleapis.com/token",
		strings.NewReader(form.Encode()),
	)
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", err
	}
	defer func() { _ = resp.Body.Close() }()
	var tok struct {
		AccessToken string `json:"access_token"`
		IDToken     string `json:"id_token"`
		TokenType   string `json:"token_type"`
		ExpiresIn   int    `json:"expires_in"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&tok); err != nil {
		return "", err
	}
	if tok.AccessToken == "" {
		return "", errors.New("token exchange failed")
	}
	// Fetch userinfo
	ureq, _ := http.NewRequestWithContext(
		ctx,
		http.MethodGet,
		"https://openidconnect.googleapis.com/v1/userinfo",
		nil,
	)
	ureq.Header.Set("Authorization", "Bearer "+tok.AccessToken)
	ures, err := http.DefaultClient.Do(ureq)
	if err != nil {
		return "", err
	}
	defer func() { _ = ures.Body.Close() }()
	var ui struct {
		Email         string `json:"email"`
		EmailVerified bool   `json:"email_verified"`
		GivenName     string `json:"given_name"`
		FamilyName    string `json:"family_name"`
		Name          string `json:"name"`
	}
	if err := json.NewDecoder(ures.Body).Decode(&ui); err != nil {
		return "", err
	}
	if ui.Email == "" {
		return "", errors.New("no email in userinfo")
	}
	uid, err := s.ensureUser(ctx, ui.Email)
	if err != nil {
		return "", err
	}
	// Try to set a display name from Google if missing
	u, err := s.app.Db.User.Get(ctx, uid)
	if err == nil && strings.TrimSpace(u.Name) == "" {
		display := strings.TrimSpace(ui.Name)
		if display == "" {
			gn := strings.TrimSpace(ui.GivenName)
			fn := strings.TrimSpace(ui.FamilyName)
			if gn != "" || fn != "" {
				if fn != "" {
					display = strings.TrimSpace(gn + " " + fn)
				} else {
					display = gn
				}
			}
		}
		if display != "" {
			_ = s.app.Db.User.UpdateOneID(uid).SetName(display).Exec(ctx)
		}
	}
	return uid, nil
}
