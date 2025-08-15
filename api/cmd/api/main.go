package main

import (
	"context"
	"encoding/json"
	"flag"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"

	// "redrawn/api/ent"
	"redrawn/api/internal/app"
	"redrawn/api/internal/config"
	"redrawn/api/internal/db"
	"redrawn/api/internal/middleware"

	// "github.com/google/uuid"

	"github.com/go-fuego/fuego"
)

//

func main() {
	openapiOnly := flag.Bool("openapi-only", false, "output OpenAPI spec to stdout and exit")
	addr := flag.String("addr", ":8080", "listen address")
	flag.Parse()

	s := fuego.NewServer(
		fuego.WithAddr(*addr),
	)

	// OpenAPI UI/Spec can be served via handlers if desired; omitted here for CLI generation

	cfg := config.FromEnv()

	// Initialize global slog default logger based on config
	setupDefaultLogger(cfg, *openapiOnly)

	// Configure logging and error behavior
	configureErrorHandling(s, cfg)
	if *openapiOnly {
		// Minimal app with nil DB to allow route registration for OpenAPI
		application := &app.App{Config: cfg, Ent: nil}
		registerRoutes(s, application)
		// Print OpenAPI spec JSON
		spec := s.OutputOpenAPISpec()
		data, err := json.MarshalIndent(spec, "", "  ")
		if err != nil {
			slog.Error("marshal openapi", slog.String("err", err.Error()))
			os.Exit(1)
		}
		if _, err := os.Stdout.Write(data); err != nil {
			slog.Error("write openapi to stdout", slog.String("err", err.Error()))
			os.Exit(1)
		}
		return
	}
	if cfg.DatabaseURL == "" {
		slog.Error("DATABASE_URL not set")
		os.Exit(1)
	}
	if cfg.SessionSecret == "" {
		slog.Warn("SESSION_SECRET not set; dev only")
	}

	// Initialize DB connection (migrations handled via Atlas CLI)
	entClient, err := db.Open(context.Background())
	if err != nil {
		slog.Error("db open failed", slog.String("err", err.Error()))
		os.Exit(1)
	}

	application := &app.App{Config: cfg, Ent: entClient}

	// River client (pgx pool) for durable jobs
	riverClient, err := setupRiver(cfg, entClient)
	if err != nil {
		slog.Error("river client init failed", slog.String("err", err.Error()))
		os.Exit(1)
	}

	// Adapter to satisfy app.TaskQueue using River
	application.Queue = newRiverAdapter(riverClient)
	application.River = riverClient

	// Session middleware
	fuego.Use(s, middleware.SessionMiddleware(cfg))
	registerRoutes(s, application)

	// Graceful shutdown to stop worker
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	go func() {
		slog.Info("starting api", slog.String("addr", *addr))
		if err := s.Run(); err != nil && err != http.ErrServerClosed {
			slog.Error("server error", slog.String("err", err.Error()))
			os.Exit(1)
		}
	}()

	// start River workers
	go func() {
		if err := riverClient.Start(ctx); err != nil && ctx.Err() == nil {
			slog.Error("river start error", slog.String("err", err.Error()))
		}
	}()

	<-ctx.Done()
	slog.Info("shutting down workers...")
	_ = riverClient.Stop(context.Background())

}
