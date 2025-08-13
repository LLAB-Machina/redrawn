package config

import (
	"os"
	"strconv"
)

type Config struct {
	DatabaseURL          string
	SessionSecret        string
	PublicBaseURL        string
	CFAccountID          string
	CFImagesToken        string
	CFImagesDeliveryHash string
	StripeSecretKey      string
	StripeWebhook        string
	StripePriceID        string
	OpenAIAPIKey         string
	CreditsPerCycle      int
}

func FromEnv() Config {
	return Config{
		DatabaseURL:          os.Getenv("DATABASE_URL"),
		SessionSecret:        os.Getenv("SESSION_SECRET"),
		PublicBaseURL:        os.Getenv("PUBLIC_BASE_URL"),
		CFAccountID:          os.Getenv("CF_ACCOUNT_ID"),
		CFImagesToken:        os.Getenv("CF_IMAGES_TOKEN"),
		CFImagesDeliveryHash: os.Getenv("CF_IMAGES_DELIVERY_HASH"),
		StripeSecretKey:      os.Getenv("STRIPE_SECRET_KEY"),
		StripeWebhook:        os.Getenv("STRIPE_WEBHOOK_SECRET"),
		StripePriceID:        os.Getenv("STRIPE_PRICE_ID"),
		OpenAIAPIKey:         os.Getenv("OPENAI_API_KEY"),
		CreditsPerCycle: func() int {
			n, _ := strconv.Atoi(os.Getenv("CREDITS_PER_CYCLE"))
			if n == 0 {
				return 1000
			}
			return n
		}(),
	}
}
