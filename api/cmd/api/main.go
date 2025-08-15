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
	"strconv"
	"strings"
	"syscall"

	// "redrawn/api/ent"
	"redrawn/api/internal/api"
	"redrawn/api/internal/app"
	"redrawn/api/internal/config"
	"redrawn/api/internal/db"
	"redrawn/api/internal/handlers"
	"redrawn/api/internal/middleware"
	"redrawn/api/internal/worker"

	// "github.com/google/uuid"

	"github.com/go-fuego/fuego"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/riverqueue/river"
	"github.com/riverqueue/river/riverdriver/riverpgxv5"
	"github.com/riverqueue/river/rivertype"
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
	{
		levelVar := new(slog.LevelVar)
		switch strings.ToLower(cfg.LogLevel) {
		case "debug":
			levelVar.Set(slog.LevelDebug)
		case "info":
			levelVar.Set(slog.LevelInfo)
		case "warn", "warning":
			levelVar.Set(slog.LevelWarn)
		case "error":
			levelVar.Set(slog.LevelError)
		default:
			levelVar.Set(slog.LevelInfo)
		}
		// When generating OpenAPI to stdout, redirect logs to stderr to avoid corrupting JSON output
		logOutput := os.Stdout
		if *openapiOnly {
			logOutput = os.Stderr
		}
		var handler slog.Handler
		if cfg.LogFormat == "text" {
			handler = slog.NewTextHandler(logOutput, &slog.HandlerOptions{Level: levelVar})
		} else {
			handler = slog.NewJSONHandler(logOutput, &slog.HandlerOptions{Level: levelVar})
		}
		slog.SetDefault(slog.New(handler))
	}

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

	// Serialize errors as application/problem+json with optional field errors
	fuego.WithErrorSerializer(func(w http.ResponseWriter, r *http.Request, err error) {
		// Map to fuego HTTPError first
		mapped := fuego.HandleHTTPError(err)

		// If it's our validation error, shape it as problem+json 400 with details
		if vErr, ok := err.(api.ErrValidation); ok {
			w.Header().Set("Content-Type", "application/problem+json")
			w.WriteHeader(http.StatusBadRequest)
			_ = json.NewEncoder(w).Encode(api.ProblemResponse{
				Type:   "https://example.com/problems/validation-error",
				Title:  "Invalid request parameters",
				Status: http.StatusBadRequest,
				Detail: "One or more fields failed validation",
				Errors: vErr.Errors,
			})
			return
		}

		// In dev, attach stack trace for easier debugging
		if cfg.Dev {
			var httpErr fuego.HTTPError
			if errors.As(mapped, &httpErr) {
				st := string(debug.Stack())
				if httpErr.Detail == "" && httpErr.Err != nil {
					httpErr.Detail = httpErr.Err.Error()
				}
				// include stack trace in the error list without using generic maps
				httpErr.Errors = append(httpErr.Errors, fuego.ErrorItem{
					Name:   "stack",
					Reason: st,
				})
				// Let fuego send JSON error; consumers may treat as problem json
				fuego.SendJSONError(w, r, httpErr)
				return
			}
		}

		// Default behavior
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

	// River client (pgx pool) for durable jobs
	pgxPool, err := pgxpool.New(context.Background(), cfg.DatabaseURL)
	if err != nil {
		slog.Error("pgx pool init failed", slog.String("err", err.Error()))
		os.Exit(1)
	}

	workers := river.NewWorkers()
	processor := worker.NewGenerateProcessor(cfg, entClient)
	riverWorker := worker.NewGenerateWorker(processor)
	river.AddWorker(workers, riverWorker)

	riverClient, err := river.NewClient(riverpgxv5.New(pgxPool), &river.Config{
		Queues: map[string]river.QueueConfig{
			river.QueueDefault: {MaxWorkers: 2},
		},
		Workers: workers,
	})
	if err != nil {
		slog.Error("river client init failed", slog.String("err", err.Error()))
		os.Exit(1)
	}

	// Adapter to satisfy app.TaskQueue using River
	application.Queue = newRiverAdapter(riverClient)
	application.PgxPool = pgxPool

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
	handlers.RegisterAdmin(s, a)
}

// riverAdapter implements app.TaskQueue over a River client.
type riverAdapter struct{ c *river.Client[pgx.Tx] }

func newRiverAdapter(c *river.Client[pgx.Tx]) *riverAdapter { return &riverAdapter{c: c} }

func (r *riverAdapter) EnqueueGenerate(ctx context.Context, payload api.GenerateJobPayload) (string, error) {
	res, err := r.c.Insert(ctx, payload, nil)
	if err != nil {
		return "", err
	}
	return strconv.FormatInt(res.Job.ID, 10), nil
}

func (r *riverAdapter) GetStatus(taskID string) (string, bool) {
	// River IDs are int64; allow numeric strings
	var idInt64 int64
	if v, err := strconv.ParseInt(taskID, 10, 64); err == nil {
		idInt64 = v
	} else {
		// Not a valid River ID
		return "", false
	}
	job, err := r.c.JobGet(context.Background(), idInt64)
	if err != nil || job == nil {
		return "", false
	}
	// Map River states roughly to our public statuses
	switch job.State {
	case rivertype.JobStateAvailable, rivertype.JobStateScheduled:
		return "queued", true
	case rivertype.JobStateRunning:
		return "running", true
	case rivertype.JobStateCompleted:
		return "succeeded", true
	case rivertype.JobStateCancelled:
		return "failed", true
	default:
		return string(job.State), true
	}
}
