package main

import (
	"redrawn/api/internal/app"
	"redrawn/api/internal/handlers"

	"github.com/go-fuego/fuego"
)

func registerRoutes(s *fuego.Server, a *app.App) {
	handlers.RegisterHealth(s, a)
	handlers.RegisterAuth(s, a)
	handlers.RegisterUsers(s, a)
	handlers.RegisterAlbums(s, a)
	handlers.RegisterMembership(s, a)
	handlers.RegisterPhotos(s, a)
	handlers.RegisterThemes(s, a)
	handlers.RegisterPublic(s, a)
	handlers.RegisterBilling(s, a)
	handlers.RegisterAdmin(s, a)
}
