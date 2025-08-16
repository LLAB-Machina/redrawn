package config

import (
	"errors"
	"os"
	"strconv"
	"strings"
)

type Config struct {
	DatabaseURL   string
	SessionSecret string
	PublicBaseURL string
	// R2 (S3-compatible) configuration
	R2AccessKeyID      string
	R2SecretAccessKey  string
	R2Bucket           string
	R2S3Endpoint       string
	R2PublicBaseURL    string
	StripeSecretKey    string
	StripeWebhook      string
	StripePriceID      string
	OpenAIAPIKey       string
	CreditsPerPurchase int
	GoogleClientID     string
	GoogleClientSecret string
	Env                string
	Dev                bool
	AdminEmails        []string
	// Logging configuration
	LogLevel  string
	LogFormat string // "json" or "text"
}

func FromEnv() Config {
	// Determine environment
	env := os.Getenv("ENV")
	if env == "" {
		env = os.Getenv("APP_ENV")
	}
	if env == "" {
		env = "development"
	}

	return Config{
		DatabaseURL:       os.Getenv("DATABASE_URL"),
		SessionSecret:     os.Getenv("SESSION_SECRET"),
		PublicBaseURL:     os.Getenv("PUBLIC_BASE_URL"),
		R2AccessKeyID:     os.Getenv("R2_ACCESS_KEY_ID"),
		R2SecretAccessKey: os.Getenv("R2_SECRET_ACCESS_KEY"),
		R2Bucket:          os.Getenv("R2_BUCKET"),
		R2S3Endpoint:      os.Getenv("R2_S3_ENDPOINT"),
		R2PublicBaseURL:   os.Getenv("R2_PUBLIC_BASE_URL"),
		StripeSecretKey:   os.Getenv("STRIPE_SECRET_KEY"),
		StripeWebhook:     os.Getenv("STRIPE_WEBHOOK_SECRET"),
		StripePriceID:     os.Getenv("STRIPE_PRICE_ID"),
		OpenAIAPIKey:      os.Getenv("OPENAI_API_KEY"),
		CreditsPerPurchase: func() int {
			n, _ := strconv.Atoi(os.Getenv("CREDITS_PER_PURCHASE"))
			if n == 0 {
				return 1
			}
			return n
		}(),
		GoogleClientID:     os.Getenv("GOOGLE_CLIENT_ID"),
		GoogleClientSecret: os.Getenv("GOOGLE_CLIENT_SECRET"),
		Env:                env,
		Dev: func() bool {
			switch env {
			case "production", "prod":
				return false
			default:
				return true
			}
		}(),
		AdminEmails: loadAdminEmails(),
		LogLevel: func() string {
			lvl := strings.ToLower(strings.TrimSpace(os.Getenv("LOG_LEVEL")))
			if lvl == "" {
				if env == "production" || env == "prod" {
					return "info"
				}
				return "debug"
			}
			return lvl
		}(),
		LogFormat: func() string {
			fmt := strings.ToLower(strings.TrimSpace(os.Getenv("LOG_FORMAT")))
			if fmt == "" {
				if env == "production" || env == "prod" {
					return "json"
				}
				return "text"
			}
			if fmt != "json" && fmt != "text" {
				return "json"
			}
			return fmt
		}(),
	}
}

func loadAdminEmails() []string {
	// Read comma-separated emails from ADMIN_EMAILS env var
	raw := os.Getenv("ADMIN_EMAILS")
	if raw == "" {
		return []string{}
	}
	parts := strings.Split(raw, ",")
	emails := make([]string, 0, len(parts))
	for _, part := range parts {
		email := strings.TrimSpace(part)
		if email != "" {
			emails = append(emails, email)
		}
	}
	return emails
}

// Validate ensures required configuration is present and well-formed.
func (c Config) Validate() error {
	if strings.TrimSpace(c.DatabaseURL) == "" {
		return errors.New("DATABASE_URL is required")
	}
	if !c.Dev && strings.TrimSpace(c.SessionSecret) == "" {
		return errors.New("SESSION_SECRET is required in production")
	}
	return nil
}
