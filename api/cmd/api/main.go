package main

import (
	"context"
	"encoding/json"
	"errors"
	"flag"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"runtime/debug"
	"strings"
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

	// Configure logging and error behavior
	// Map generic errors to structured HTTP errors (and map common strings to statuses)
	fuego.WithEngineOptions(
		fuego.WithErrorHandler(func(e error) error {
			if e != nil {
				msg := strings.ToLower(e.Error())
				switch {
				case strings.Contains(msg, "unauthorized"):
					return fuego.UnauthorizedError{Err: e}
				case strings.Contains(msg, "forbidden"):
					return fuego.ForbiddenError{Err: e}
				case strings.Contains(msg, "not found"):
					return fuego.NotFoundError{Err: e}
				}
			}
			return fuego.HandleHTTPError(e)
		}),
	)(s)
	// Structured request/response logging (keep defaults; could be tuned via config later)
	fuego.WithLoggingMiddleware(fuego.LoggingConfig{})(s)

	// In dev, serialize errors with stack traces for easier debugging
	fuego.WithErrorSerializer(func(w http.ResponseWriter, r *http.Request, err error) {
		// Use default mapping to HTTPError
		mapped := fuego.HandleHTTPError(err)
		if cfg.Dev {
			var httpErr fuego.HTTPError
			if errors.As(mapped, &httpErr) {
				st := string(debug.Stack())
				// Ensure human-readable message in dev
				if httpErr.Detail == "" && httpErr.Err != nil {
					httpErr.Detail = httpErr.Err.Error()
				}
				httpErr.Errors = append(httpErr.Errors, fuego.ErrorItem{
					Name:   "stack",
					Reason: "see more",
					More:   map[string]any{"stack": st},
				})
				fuego.SendJSONError(w, r, httpErr)
				return
			}
		}
		fuego.SendJSONError(w, r, mapped)
	})(s)
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
