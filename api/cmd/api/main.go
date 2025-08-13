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
	"time"

	"redrawn/api/internal/app"
	"redrawn/api/internal/config"
	"redrawn/api/internal/db"
	"redrawn/api/internal/handlers"
	"redrawn/api/internal/middleware"
	"redrawn/api/internal/queue"

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
	if *openapiOnly {
		// Minimal app with nil DB to allow route registration for OpenAPI
		application := &app.App{Config: cfg, Ent: nil}
		registerRoutes(s, application)
		// Print OpenAPI spec JSON
		spec := s.Engine.OutputOpenAPISpec()
		data, err := json.MarshalIndent(spec, "", "  ")
		if err != nil {
			slog.Error("marshal openapi", slog.String("err", err.Error()))
			os.Exit(1)
		}
		os.Stdout.Write(data)
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
	entClient, err := db.Open(nil)
	if err != nil {
		slog.Error("db open failed", slog.String("err", err.Error()))
		os.Exit(1)
	}

	application := &app.App{Config: cfg, Ent: entClient}

	// Processor for DB queue: receives payload only
	processor := func(ctx context.Context, payload map[string]any) error {
		// TODO: call generation pipeline using payload["original_id"], payload["theme_id"]
		return nil
	}
	dbq := queue.NewDB(entClient, 500*time.Millisecond, 2, processor)
	application.Queue = dbq

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

	// start background workers
	dbq.Run(ctx)

	<-ctx.Done()
	slog.Info("shutting down workers...")
	dbq.Shutdown(context.Background())
}

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
}
