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
	openaiclient "redrawn/api/internal/clients/openai"
	storageclient "redrawn/api/internal/clients/storage"
	"redrawn/api/internal/config"
	"redrawn/api/internal/db"
	"redrawn/api/internal/middleware"
	queue_river "redrawn/api/internal/queue/river"

	// "github.com/google/uuid"

	"github.com/go-fuego/fuego"
	stripe "github.com/stripe/stripe-go/v82"
)

//

func main() {
	openapiOnly := flag.Bool("openapi-only", false, "output OpenAPI spec to stdout and exit")
	addr := flag.String("addr", ":8080", "listen address")
	flag.Parse()

	cfg := config.FromEnv()

	server := fuego.NewServer(
		fuego.WithAddr(*addr),
	)

	// OpenAPI UI/Spec can be served via handlers if desired; omitted here for CLI generation
	if err := cfg.Validate(); err != nil {
		slog.Error("invalid config", slog.String("err", err.Error()))
		os.Exit(1)
	}

	// Initialize global slog default logger based on config
	setupDefaultLogger(cfg, *openapiOnly)

	// Configure logging and error behavior
	configureErrorHandling(server, cfg)
	if *openapiOnly {
		// Minimal app with nil DB to allow route registration for OpenAPI
		application := &app.App{Config: cfg}
		registerRoutes(server, application)
		// Print OpenAPI spec JSON
		spec := server.OutputOpenAPISpec()
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
	dbClient, err := db.Open(context.Background())
	if err != nil {
		slog.Error("db open failed", slog.String("err", err.Error()))
		os.Exit(1)
	}

	// Initialize Jet DB connection
	jetDB, err := db.OpenJet(context.Background())
	if err != nil {
		slog.Error("jet db open failed", slog.String("err", err.Error()))
		os.Exit(1)
	}

	application := &app.App{Config: cfg}
	application.Db = dbClient
	application.JetDB = jetDB

	// External clients
	application.OpenAI = openaiclient.NewFromConfig(cfg)
	application.Storage = storageclient.NewR2FromConfig(cfg)
	if cfg.StripeSecretKey != "" {
		application.Stripe = stripe.NewClient(cfg.StripeSecretKey)
	}

	// River client (pgx pool) for durable jobs
	riverClient, err := queue_river.Setup(application)
	if err != nil {
		slog.Error("river client init failed", slog.String("err", err.Error()))
		os.Exit(1)
	}

	// Adapter to satisfy app.TaskQueue using River
	application.Queue = queue_river.NewAdapter(riverClient)
	application.River = riverClient

	// CORS middleware - sets headers on ALL requests (not just OPTIONS)
	fuego.Use(server, func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			origin := r.Header.Get("Origin")

			// Check if origin is allowed
			allowed := false
			if origin != "" {
				for _, allowedOrigin := range cfg.CORSAllowedOrigins {
					if allowedOrigin == "*" || allowedOrigin == origin {
						allowed = true
						break
					}
				}
			}

			// Set CORS headers for ALL requests (GET, POST, etc.)
			if allowed {
				w.Header().Set("Access-Control-Allow-Origin", origin)
				w.Header().Set("Access-Control-Allow-Credentials", "true")
			}

			// Always set these headers for any request with an Origin
			if origin != "" {
				w.Header().
					Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH")
				w.Header().
					Set("Access-Control-Allow-Headers", "Content-Type, Authorization, Accept")
			}

			next.ServeHTTP(w, r)
		})
	})

	// Session middleware
	fuego.Use(server, middleware.SessionMiddleware(cfg))
	fuego.Use(server, middleware.RequestLogger)
	registerRoutes(server, application)

	// Graceful shutdown to stop worker
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	go func() {
		slog.Info("starting api", slog.String("addr", *addr))
		err := server.Run()
		if err != nil && err != http.ErrServerClosed {
			slog.Error("server error", slog.String("err", err.Error()))
			os.Exit(1)
		}
	}()

	// start River workers
	go func() {
		err := riverClient.Start(ctx)
		if err != nil && ctx.Err() == nil {
			slog.Error("river start error", slog.String("err", err.Error()))
		}
	}()

	<-ctx.Done()
	slog.Info("shutting down workers...")
	_ = riverClient.Stop(context.Background())
}
