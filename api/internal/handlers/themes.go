package handlers

import (
	"redrawn/api/internal/api"
	"redrawn/api/internal/app"
	"redrawn/api/internal/services"

	"github.com/go-fuego/fuego"
)

type createThemeReq = api.CreateThemeRequest

func RegisterThemes(s *fuego.Server, a *app.App) {
	service := services.NewThemesService(a)

	fuego.Get(s, "/v1/themes", func(c fuego.ContextNoBody) ([]api.Theme, error) {
		return service.List(c.Context())
	})

	fuego.Post(
		s,
		"/v1/themes",
		func(c fuego.ContextWithBody[createThemeReq]) (api.IDResponse, error) {
			body, err := BindAndValidate(c)
			if err != nil {
				return api.IDResponse{}, err
			}
			return service.Create(c.Context(), body.Name, body.Prompt)
		},
	)
}
