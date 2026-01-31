package app

import (
	"database/sql"
	"log/slog"

	"redrawn/internal/config"

	_ "github.com/lib/pq"
)

// App holds application-wide dependencies
type App struct {
	Config *config.Config
	DB     *sql.DB
	Logger *slog.Logger
}

// New creates a new App instance
func New(cfg *config.Config) (*App, error) {
	logger := slog.Default()

	// Connect to database
	db, err := sql.Open("postgres", cfg.Database.URL)
	if err != nil {
		return nil, err
	}

	// Verify connection
	if err := db.Ping(); err != nil {
		return nil, err
	}

	logger.Info("Connected to database")

	return &App{
		Config: cfg,
		DB:     db,
		Logger: logger,
	}, nil
}

// Close cleans up resources
func (a *App) Close() error {
	if a.DB != nil {
		return a.DB.Close()
	}
	return nil
}
