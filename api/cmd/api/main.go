package main

import (
	"flag"
	"log/slog"
	"os"

	"github.com/joho/godotenv"
)

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
	// TODO: Implement OpenAPI generation
	return nil
}

func runServer() error {
	slog.Info("Starting Redrawn API server...")
	// TODO: Implement server
	return nil
}
