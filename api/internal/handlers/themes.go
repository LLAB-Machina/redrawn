package handlers

import (
	"redrawn/api/internal/api"
	"redrawn/api/internal/app"
	"redrawn/api/internal/services"

	"github.com/go-fuego/fuego"
	"github.com/go-fuego/fuego/option"
)

type createThemeReq = api.CreateThemeRequest

func RegisterThemes(s *fuego.Server, a *app.App) {
	service := services.NewThemesService(a)

	fuego.Get(s, "/themes", func(c fuego.ContextNoBody) ([]api.Theme, error) {
		return service.List(c.Context())
	}, option.Summary("List themes"), option.OperationID("ListThemes"))

	fuego.Post(
		s,
		"/themes",
		func(c fuego.ContextWithBody[createThemeReq]) (api.IDResponse, error) {
			body, err := BindAndValidate(c)
			if err != nil {
				return api.IDResponse{}, err
			}
			return service.Create(c.Context(), body.Name, body.Prompt)
		},
		option.Summary("Create theme"),
		option.OperationID("CreateTheme"),
	)
}
