package handlers

import (
	"github.com/go-fuego/fuego"
	"github.com/go-fuego/fuego/option"

	"redrawn/api/internal/api"
	"redrawn/api/internal/app"
	"redrawn/api/internal/services"
)

func RegisterPublic(s *fuego.Server, a *app.App) {
	service := services.NewPublicService(a)
	fuego.Get(s, "/albums/{slug}", func(c fuego.ContextNoBody) (api.PublicAlbum, error) {
		slug := c.PathParam("slug")
		return service.AlbumBySlug(c.Context(), slug)
	}, option.Summary("Get public album by slug"), option.OperationID("GetPublicAlbumBySlug"))

	// Public invite preview (no auth)
	fuego.Get(
		s,
		"/albums/{id}/invite/{token}",
		func(c fuego.ContextNoBody) (api.InviteLinkPreview, error) {
			albumID := c.PathParam("id")
			token := c.PathParam("token")
			ms := services.NewMembershipService(a)
			return ms.PreviewLink(c.Context(), albumID, token)
		},
		option.Summary("Preview invite link anonymously"),
		option.OperationID("PreviewInviteLink"),
	)
}
