package config

import (
	"fmt"
	"os"
	"strconv"
	"strings"
)

// Config holds all application configuration
type Config struct {
	Database     DatabaseConfig
	Storage      StorageConfig
	API          APIConfig
	Stripe       StripeConfig
	OpenAI       OpenAIConfig
	AdminUserIDs []string // List of user IDs with admin privileges
}

// DatabaseConfig holds database settings
type DatabaseConfig struct {
	URL string
}

// StorageConfig holds S3-compatible storage settings
type StorageConfig struct {
	Endpoint  string
	AccessKey string
	SecretKey string
	Bucket    string
	UseSSL    bool
}

// APIConfig holds API server settings
type APIConfig struct {
	Port      int
	BaseURL   string
	JWTSecret string
}

// StripeConfig holds Stripe settings
type StripeConfig struct {
	SecretKey     string
	PublishableKey string
	WebhookSecret string
}

// OpenAIConfig holds OpenAI settings
type OpenAIConfig struct {
	APIKey string
}

// Load reads configuration from environment variables
func Load() (*Config, error) {
	return &Config{
		Database: DatabaseConfig{
			URL: getEnv("DATABASE_URL", "postgres://dev:dev@localhost:5432/redrawn?sslmode=disable"),
		},
		Storage: StorageConfig{
			Endpoint:  getEnv("STORAGE_ENDPOINT", "localhost:9000"),
			AccessKey: getEnv("STORAGE_ACCESS_KEY", "minioadmin"),
			SecretKey: getEnv("STORAGE_SECRET_KEY", "minioadmin"),
			Bucket:    getEnv("STORAGE_BUCKET", "redrawn"),
			UseSSL:    getBoolEnv("STORAGE_USE_SSL", false),
		},
		API: APIConfig{
			Port:      getIntEnv("API_PORT", 8080),
			BaseURL:   getEnv("API_BASE_URL", "http://localhost:8080"),
			JWTSecret: getEnv("JWT_SECRET", "change-me-in-production"),
		},
		Stripe: StripeConfig{
			SecretKey:      getEnv("STRIPE_SECRET_KEY", ""),
			PublishableKey: getEnv("STRIPE_PUBLISHABLE_KEY", ""),
			WebhookSecret:  getEnv("STRIPE_WEBHOOK_SECRET", ""),
		},
		OpenAI: OpenAIConfig{
			APIKey: getEnv("OPENAI_API_KEY", ""),
		},
		AdminUserIDs: getSliceEnv("ADMIN_USER_IDS", []string{}),
	}, nil
}

func getEnv(key, defaultVal string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return defaultVal
}

func getIntEnv(key string, defaultVal int) int {
	if v := os.Getenv(key); v != "" {
		if i, err := strconv.Atoi(v); err == nil {
			return i
		}
	}
	return defaultVal
}

func getBoolEnv(key string, defaultVal bool) bool {
	if v := os.Getenv(key); v != "" {
		if b, err := strconv.ParseBool(v); err == nil {
			return b
		}
	}
	return defaultVal
}

func getSliceEnv(key string, defaultVal []string) []string {
	if v := os.Getenv(key); v != "" {
		// Split by comma and trim spaces
		parts := strings.Split(v, ",")
		result := make([]string, 0, len(parts))
		for _, p := range parts {
			if trimmed := strings.TrimSpace(p); trimmed != "" {
				result = append(result, trimmed)
			}
		}
		return result
	}
	return defaultVal
}
