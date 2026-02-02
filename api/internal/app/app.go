package app

import (
	"context"
	"database/sql"
	"fmt"
	"log/slog"

	"redrawn/internal/config"
	"redrawn/internal/services"

	_ "github.com/lib/pq"
)

// App holds application-wide dependencies
type App struct {
	Config                *config.Config
	DB                    *sql.DB
	Logger                *slog.Logger
	UserService           *services.UserService
	AuthService           *services.AuthService
	AlbumService          *services.AlbumService
	PhotoService          *services.PhotoService
	ThemeService          *services.ThemeService
	GeneratedPhotoService *services.GeneratedPhotoService
	CreditService         *services.CreditService
	PaymentService        *services.PaymentService
	StorageService        *services.StorageService
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

	// Initialize services
	userService := services.NewUserService(db)
	authService := services.NewAuthService(userService, cfg.API.JWTSecret)
	albumService := services.NewAlbumService(db)
	photoService := services.NewPhotoService(db)
	themeService := services.NewThemeService(db)
	generatedPhotoService := services.NewGeneratedPhotoService(db)
	creditService := services.NewCreditService(db)
	paymentService := services.NewPaymentService(cfg.Stripe.SecretKey, cfg.Stripe.WebhookSecret, creditService)
	
	// Initialize storage service
	storageService, err := services.NewStorageService(
		cfg.Storage.Endpoint,
		cfg.Storage.AccessKey,
		cfg.Storage.SecretKey,
		cfg.Storage.Bucket,
		cfg.Storage.UseSSL,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create storage service: %w", err)
	}
	
	// Ensure bucket exists
	if err := storageService.EnsureBucket(context.Background()); err != nil {
		logger.Warn("Failed to ensure storage bucket exists", "error", err)
	}

	return &App{
		Config:                cfg,
		DB:                    db,
		Logger:                logger,
		UserService:           userService,
		AuthService:           authService,
		AlbumService:          albumService,
		PhotoService:          photoService,
		ThemeService:          themeService,
		GeneratedPhotoService: generatedPhotoService,
		CreditService:         creditService,
		PaymentService:        paymentService,
		StorageService:        storageService,
	}, nil
}

// Close cleans up resources
func (a *App) Close() error {
	if a.DB != nil {
		return a.DB.Close()
	}
	return nil
}
