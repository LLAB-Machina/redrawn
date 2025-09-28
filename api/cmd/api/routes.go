package main

import (
	"net/http"

	"redrawn/api/internal/app"
	"redrawn/api/internal/handlers"
	"redrawn/api/internal/middleware"

	"github.com/go-fuego/fuego"
)

func registerRoutes(s *fuego.Server, a *app.App) {
	// Catch-all OPTIONS handler for CORS preflight - register first
	s.Mux.HandleFunc("OPTIONS /{path...}", func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		// Check if origin is allowed
		allowed := false
		for _, allowedOrigin := range a.Config.CORSAllowedOrigins {
			if allowedOrigin == "*" || allowedOrigin == origin {
				allowed = true
				break
			}
		}
		if allowed && origin != "" {
			w.Header().Set("Access-Control-Allow-Origin", origin)
		}
		// Echo requested headers if provided, otherwise default whitelisted
		reqHdrs := r.Header.Get("Access-Control-Request-Headers")
		if reqHdrs == "" {
			reqHdrs = "Content-Type, Authorization, Accept"
		}
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH")
		w.Header().Set("Access-Control-Allow-Headers", reqHdrs)
		w.Header().Set("Access-Control-Allow-Credentials", "true")
		w.Header().Set("Access-Control-Max-Age", "600")
		w.WriteHeader(http.StatusNoContent)
	})

	// Public endpoints
	handlers.RegisterHealth(s, a)
	authGroup := fuego.Group(s, "v1/auth")
	handlers.RegisterAuth(authGroup, a)
	publicGroup := fuego.Group(s, "v1/public")
	handlers.RegisterPublic(publicGroup, a)

	// Protected endpoints (require session)
	grp := fuego.Group(s, "")
	fuego.Use(grp, middleware.RequireAuth)

	usersGroup := fuego.Group(grp, "/v1/users")
	handlers.RegisterUsers(usersGroup, a)
	albumsGroup := fuego.Group(grp, "/v1/albums")
	handlers.RegisterAlbums(albumsGroup, a)
	membershipGroup := fuego.Group(grp, "/v1/albums/membership")
	handlers.RegisterMembership(membershipGroup, a)
	photosGroup := fuego.Group(grp, "/v1/albums/photos")
	handlers.RegisterPhotos(photosGroup, a)

	themesGroup := fuego.Group(grp, "/v1/themes")
	handlers.RegisterThemes(themesGroup, a)

	billingGroup := fuego.Group(grp, "/v1/billing")
	handlers.RegisterBilling(billingGroup, a)

	// Admin endpoints (RequireAuth + AdminOnly)
	adminGrp := fuego.Group(grp, "/v1/admin")
	fuego.Use(adminGrp, middleware.RequireAuth, middleware.AdminOnly(a))
	handlers.RegisterAdmin(adminGrp, a)
}
