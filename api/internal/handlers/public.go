package handlers

import (
	"github.com/go-fuego/fuego"

	"redrawn/api/internal/api"
	"redrawn/api/internal/app"
	"redrawn/api/internal/services"
)

func RegisterPublic(s *fuego.Server, a *app.App) {
	service := services.NewPublicService(a)
	fuego.Get(s, "/v1/public/albums/{slug}", func(c fuego.ContextNoBody) (api.PublicAlbum, error) {
		slug := c.PathParam("slug")
		return service.AlbumBySlug(c.Context(), slug)
	})

	// Public invite preview (no auth)
	fuego.Get(
		s,
		"/v1/public/albums/{id}/invite/{token}",
		func(c fuego.ContextNoBody) (api.InviteLinkPreview, error) {
			albumID := c.PathParam("id")
			token := c.PathParam("token")
			ms := services.NewMembershipService(a)
			return ms.PreviewLink(c.Context(), albumID, token)
		},
	)
}
