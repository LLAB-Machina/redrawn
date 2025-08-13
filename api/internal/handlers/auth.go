package handlers

import (
	"redrawn/api/internal/api"
	"redrawn/api/internal/app"
	"redrawn/api/internal/middleware"
	"redrawn/api/internal/services"

	"github.com/go-fuego/fuego"
)

type magicLinkReq = api.MagicLinkRequest
type verifyReq = api.VerifyRequest

func RegisterAuth(s *fuego.Server, a *app.App) {
	svc := services.NewAuthService(a)

	fuego.Post(s, "/v1/auth/request-magic-link", func(c fuego.ContextWithBody[magicLinkReq]) (api.StatusResponse, error) {
		body, err := c.Body()
		if err != nil {
			return api.StatusResponse{}, err
		}
		if err := svc.RequestMagicLink(c.Context(), body.Email); err != nil {
			return api.StatusResponse{}, err
		}
		c.Response().WriteHeader(202)
		return api.StatusResponse{Status: "sent"}, nil
	})

	fuego.Post(s, "/v1/auth/verify", func(c fuego.ContextWithBody[verifyReq]) (api.OkResponse, error) {
		body, err := c.Body()
		if err != nil {
			return api.OkResponse{}, err
		}
		if err := svc.Verify(c.Context(), body.Token); err != nil {
			return api.OkResponse{}, err
		}
		// set session cookie
		cookie := middleware.MakeSessionCookie(a.Config, body.Token)
		httpRes := c.Response()
		httpRes.Header().Add("Set-Cookie", cookie.String())
		return api.OkResponse{Ok: "true"}, nil
	})

	fuego.Post(s, "/v1/auth/logout", func(c fuego.ContextNoBody) (api.OkResponse, error) {
		if err := svc.Logout(c.Context()); err != nil {
			return api.OkResponse{}, err
		}
		cookie := middleware.ClearSessionCookie()
		c.Response().Header().Add("Set-Cookie", cookie.String())
		return api.OkResponse{Ok: "true"}, nil
	})
}
