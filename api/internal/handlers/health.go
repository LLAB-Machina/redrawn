package handlers

import (
	"net/http"

	"github.com/go-fuego/fuego"
	"redrawn/internal/app"
)

// HealthResponse represents the health check response
type HealthResponse struct {
	Status    string `json:"status"`
	Version   string `json:"version"`
	Database  string `json:"database"`
}

// HealthHandler handles health check requests
type HealthHandler struct {
	version string
}

// NewHealthHandler creates a new HealthHandler
func NewHealthHandler(version string) *HealthHandler {
	return &HealthHandler{version: version}
}

// RegisterRoutes registers health routes
func (h *HealthHandler) RegisterRoutes(s *fuego.Server) {
	fuego.Get(s, "/health", h.GetHealth,
		fuego.OptionTags("System"),
		fuego.OptionOperationID("get_health"),
		fuego.OptionDescription("Health check endpoint"),
	)
}

// GetHealth returns the health status
func (h *HealthHandler) GetHealth(c *fuego.ContextWithBody[any]) (HealthResponse, error) {
	a := app.FromContext(c.Context())
	
	dbStatus := "connected"
	if a != nil && a.DB != nil {
		if err := a.DB.Ping(); err != nil {
			dbStatus = "disconnected"
		}
	}

	return HealthResponse{
		Status:   "ok",
		Version:  h.version,
		Database: dbStatus,
	}, nil
}
