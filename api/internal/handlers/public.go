package handlers

import (
	"redrawn/api/internal/api"
	"redrawn/api/internal/app"
	"redrawn/api/internal/services"

	"github.com/go-fuego/fuego"
)

func RegisterPublic(s *fuego.Server, a *app.App) {
	svc := services.NewPublicService(a)
	fuego.Get(s, "/v1/public/albums/{slug}", func(c fuego.ContextNoBody) (api.PublicAlbum, error) {
		slug := c.PathParam("slug")
		return svc.AlbumBySlug(c.Context(), slug)
	})
}
