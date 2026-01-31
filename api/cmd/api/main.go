package main

import (
	"flag"
	"fmt"
	"log/slog"
	"os"

	"github.com/go-fuego/fuego"
	"github.com/joho/godotenv"
	"redrawn/internal/app"
	"redrawn/internal/config"
	"redrawn/internal/handlers"
)

const version = "0.1.0"

func main() {
	// Load .env file if present
	_ = godotenv.Load("../.env")

	// Flags
	openapiOnly := flag.Bool("openapi-only", false, "Generate OpenAPI spec and exit")
	flag.Parse()

	// Setup logger
	logger := slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	}))
	slog.SetDefault(logger)

	if *openapiOnly {
		if err := generateOpenAPI(); err != nil {
			slog.Error("Failed to generate OpenAPI", "error", err)
			os.Exit(1)
		}
		return
	}

	// Run server
	if err := runServer(); err != nil {
		slog.Error("Server failed", "error", err)
		os.Exit(1)
	}
}

func generateOpenAPI() error {
	slog.Info("Generating OpenAPI spec...")
	
	// Create a server just for OpenAPI generation
	s := fuego.NewServer()
	registerRoutes(s, nil)
	
	return nil
}

func runServer() error {
	// Load config
	cfg, err := config.Load()
	if err != nil {
		return fmt.Errorf("failed to load config: %w", err)
	}

	// Create app
	application, err := app.New(cfg)
	if err != nil {
		return fmt.Errorf("failed to create app: %w", err)
	}
	defer application.Close()

	slog.Info("Starting Redrawn API server", 
		"version", version,
		"port", cfg.API.Port,
	)

	// Create Fuego server
	s := fuego.NewServer(
		fuego.WithAddr(fmt.Sprintf(":%d", cfg.API.Port)),
	)

	// Register routes
	registerRoutes(s, application)

	// Run server
	return s.Run()
}

func registerRoutes(s *fuego.Server, a *app.App) {
	// Health check
	healthHandler := handlers.NewHealthHandler(version)
	healthHandler.RegisterRoutes(s)

	// Auth routes
	if a != nil {
		authHandler := handlers.NewAuthHandler(a)
		authHandler.RegisterRoutes(s)
	}
}
