package handlers

import (
	"net/http"
	"redrawn/api/internal/api"
	"redrawn/api/internal/app"
	"redrawn/api/internal/middleware"
	"redrawn/api/internal/services"

	"github.com/go-fuego/fuego"
)

type magicLinkReq = api.MagicLinkRequest
type verifyReq = api.VerifyRequest

func RegisterAuth(s *fuego.Server, a *app.App) {
	service := services.NewAuthService(a)

	fuego.Post(s, "/v1/auth/request-magic-link", func(c fuego.ContextWithBody[magicLinkReq]) (api.StatusResponse, error) {
		body, err := BindAndValidate(c)
		if err != nil {
			return api.StatusResponse{}, err
		}
		if err := service.RequestMagicLink(c.Context(), body.Email); err != nil {
			return api.StatusResponse{}, err
		}
		c.Response().WriteHeader(202)
		return api.StatusResponse{Status: "sent"}, nil
	})

	fuego.Post(s, "/v1/auth/verify", func(c fuego.ContextWithBody[verifyReq]) (api.OkResponse, error) {
		body, err := BindAndValidate(c)
		if err != nil {
			return api.OkResponse{}, err
		}
		userID, err := service.Verify(c.Context(), body.Token)
		if err != nil {
			return api.OkResponse{}, err
		}
		// set session cookie to user ID
		cookie := middleware.MakeSessionCookie(a.Config, userID)
		httpRes := c.Response()
		httpRes.Header().Add("Set-Cookie", cookie.String())
		return api.OkResponse{Ok: "true"}, nil
	})

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

	// Google OAuth callback: exchanges code, sets session cookie, redirects
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
		dest := "/app"
		if next != "" && next[0] == '/' {
			dest = next
		}
		httpRes.Header().Set("Location", dest)
		httpRes.WriteHeader(http.StatusFound)
		return api.OkResponse{Ok: "true"}, nil
	})
}
