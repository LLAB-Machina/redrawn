package handlers

import (
	"redrawn/api/internal/api"
	"redrawn/api/internal/app"
	"redrawn/api/internal/services"

	"github.com/go-fuego/fuego"
	"github.com/go-fuego/fuego/option"
)

type patchMeReq = api.PatchMeRequest

func RegisterUsers(s *fuego.Server, a *app.App) {
	service := services.NewUsersService(a)

	fuego.Get(s, "/me", func(c fuego.ContextNoBody) (api.User, error) {
		return service.GetMe(c.Context())
	}, option.Summary("Get current user"), option.OperationID("Me"))

	fuego.Patch(s, "/me", func(c fuego.ContextWithBody[patchMeReq]) (api.OkResponse, error) {
		body, err := BindAndValidate(c)
		if err != nil {
			return api.OkResponse{}, err
		}
		if err := service.PatchMe(c.Context(), body.Name); err != nil {
			return api.OkResponse{}, err
		}
		return api.OkResponse{Ok: "true"}, nil
	}, option.Summary("Update current user"), option.OperationID("UpdateMe"))
}
