package main

import (
	"redrawn/api/internal/app"
	"redrawn/api/internal/handlers"
	"redrawn/api/internal/middleware"

	"github.com/go-fuego/fuego"
)

func registerRoutes(s *fuego.Server, a *app.App) {
	// Public endpoints
	handlers.RegisterHealth(s, a)
	handlers.RegisterAuth(s, a)
	handlers.RegisterPublic(s, a)

	// Protected endpoints (require session)
	grp := fuego.Group(s, "")
	fuego.Use(grp, middleware.RequireAuth)
	handlers.RegisterUsers(grp, a)
	handlers.RegisterAlbums(grp, a)
	handlers.RegisterMembership(grp, a)
	handlers.RegisterPhotos(grp, a)
	handlers.RegisterThemes(grp, a)
	handlers.RegisterBilling(grp, a)

	// Admin endpoints (RequireAuth + AdminOnly)
	adminGrp := fuego.Group(s, "")
	fuego.Use(adminGrp, middleware.RequireAuth, middleware.AdminOnly(a))
	handlers.RegisterAdmin(adminGrp, a)
}
