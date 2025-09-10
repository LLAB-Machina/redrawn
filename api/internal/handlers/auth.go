package handlers

import (
	"net/http"
	"strings"

	"github.com/go-fuego/fuego"

	"redrawn/api/internal/api"
	"redrawn/api/internal/app"
	"redrawn/api/internal/middleware"
	"redrawn/api/internal/services"
)

func RegisterAuth(s *fuego.Server, a *app.App) {
	service := services.NewAuthService(a)

	fuego.Post(s, "/v1/auth/logout", func(c fuego.ContextNoBody) (api.OkResponse, error) {
		if err := service.Logout(c.Context()); err != nil {
			return api.OkResponse{}, err
		}
		cookie := middleware.ClearSessionCookie()
		c.Response().Header().Add("Set-Cookie", cookie.String())
		return api.OkResponse{Ok: "true"}, nil
	})

	// Google OAuth start: returns redirect URL
	fuego.Get(s, "/v1/auth/google/start", func(c fuego.ContextNoBody) (api.URLResponse, error) {
		next := c.Request().URL.Query().Get("next")
		u, err := service.GoogleStartURL(next)
		if err != nil {
			return api.URLResponse{}, err
		}
		return api.URLResponse{URL: u}, nil
	})

	// Google OAuth callback: exchanges code, sets session cookie, optionally accepts invite, redirects
	fuego.Get(s, "/v1/auth/google/callback", func(c fuego.ContextNoBody) (api.OkResponse, error) {
		code := c.Request().URL.Query().Get("code")
		next := c.Request().URL.Query().Get("state")
		uid, err := service.GoogleVerify(c.Context(), code)
		if err != nil {
			return api.OkResponse{}, err
		}
		cookie := middleware.MakeSessionCookie(a.Config, uid)
		httpRes := c.Response()
		httpRes.Header().Add("Set-Cookie", cookie.String())

		// Redirect to frontend URL
		frontendURL := a.Config.FrontendURL
		if frontendURL == "" {
			frontendURL = a.Config.PublicBaseURL // fallback
		}

		dest := strings.TrimRight(frontendURL, "/") + "/app"
		if strings.HasPrefix(next, "/join/") {
			// Expected: /join/{albumId}/{token}
			parts := strings.Split(strings.TrimPrefix(next, "/join/"), "/")
			if len(parts) == 2 {
				albumID := parts[0]
				token := parts[1]
				// Best-effort server-side acceptance to avoid exposing token in final URL
				ms := services.NewMembershipService(a)
				_ = ms.AcceptLink(c.Context(), albumID, token, uid)
				dest = strings.TrimRight(frontendURL, "/") + "/app/albums/" + albumID
			} else if next != "" && next[0] == '/' {
				dest = strings.TrimRight(frontendURL, "/") + next
			}
		} else if next != "" && next[0] == '/' {
			dest = strings.TrimRight(frontendURL, "/") + next
		}
		httpRes.Header().Set("Location", dest)
		httpRes.WriteHeader(http.StatusFound)
		return api.OkResponse{Ok: "true"}, nil
	})
}
