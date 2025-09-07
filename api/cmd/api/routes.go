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
