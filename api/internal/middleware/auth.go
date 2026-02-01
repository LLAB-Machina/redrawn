package middleware

import (
	"context"
	"net/http"
	"strings"

	"github.com/go-fuego/fuego"
)

// contextKey is a type for context keys
type contextKey string

const userIDKey contextKey = "userID"

// AuthMiddleware creates a middleware that validates JWT tokens
func AuthMiddleware(jwtSecret string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			authHeader := r.Header.Get("Authorization")
			if authHeader == "" {
				next.ServeHTTP(w, r)
				return
			}

			// Extract token from "Bearer <token>"
			parts := strings.SplitN(authHeader, " ", 2)
			if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
				next.ServeHTTP(w, r)
				return
			}

			tokenString := parts[1]

			// TODO: Validate JWT token and extract user ID
			// For now, we'll just pass through and let handlers check
			// This is a placeholder for full JWT validation
			_ = tokenString
			_ = jwtSecret

			next.ServeHTTP(w, r)
		})
	}
}

// GetUserIDFromContext extracts user ID from context
func GetUserIDFromContext(ctx context.Context) string {
	if userID, ok := ctx.Value(userIDKey).(string); ok {
		return userID
	}
	return ""
}

// WithUserID adds user ID to context
func WithUserID(ctx context.Context, userID string) context.Context {
	return context.WithValue(ctx, userIDKey, userID)
}

// FuegoAuthMiddleware is a Fuego-compatible auth middleware
func FuegoAuthMiddleware(jwtSecret string) fuego.Middleware {
	return func(next http.Handler) http.Handler {
		return AuthMiddleware(jwtSecret)(next)
	}
}
