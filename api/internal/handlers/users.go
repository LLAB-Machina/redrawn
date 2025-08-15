package handlers

import (
	"redrawn/api/internal/api"
	"redrawn/api/internal/app"
	"redrawn/api/internal/services"

	"github.com/go-fuego/fuego"
)

type patchMeReq = api.PatchMeRequest

func RegisterUsers(s *fuego.Server, a *app.App) {
	service := services.NewUsersService(a)

	fuego.Get(s, "/v1/me", func(c fuego.ContextNoBody) (api.User, error) {
		return service.GetMe(c.Context())
	})

	fuego.Patch(s, "/v1/me", func(c fuego.ContextWithBody[patchMeReq]) (api.OkResponse, error) {
		body, err := BindAndValidate(c)
		if err != nil {
			return api.OkResponse{}, err
		}
		if err := service.PatchMe(c.Context(), body.Name, body.Handle); err != nil {
			return api.OkResponse{}, err
		}
		return api.OkResponse{Ok: "true"}, nil
	})
}
