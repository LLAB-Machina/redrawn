package handlers

import (
	"redrawn/api/internal/api"
	"redrawn/api/internal/app"

	"github.com/go-fuego/fuego"
	"github.com/go-fuego/fuego/option"
)

func RegisterHealth(s *fuego.Server, _ *app.App) {
	fuego.Get(s, "/health", func(c fuego.ContextNoBody) (api.StatusResponse, error) {
		return api.StatusResponse{Status: "ok"}, nil
	}, option.Summary("Healthcheck"), option.OperationID("HealthCheck"))
}
