package middleware

import (
	"context"
	"net/http"
	"strings"

	"github.com/go-fuego/fuego"
	"github.com/golang-jwt/jwt/v5"
)

// contextKey is a type for context keys
type contextKey string

const userIDKey contextKey = "userID"

// Claims represents JWT claims (duplicated from auth service to avoid circular import)
type Claims struct {
	UserID string `json:"user_id"`
	Email  string `json:"email"`
	jwt.RegisteredClaims
}

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

			// Validate JWT token and extract user ID
			claims, err := validateToken(tokenString, jwtSecret)
			if err != nil {
				// Token invalid - continue without user context
				next.ServeHTTP(w, r)
				return
			}

			// Add user ID to context
			ctx := WithUserID(r.Context(), claims.UserID)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// validateToken validates a JWT token and returns the claims
func validateToken(tokenString string, jwtSecret string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		return []byte(jwtSecret), nil
	})
	
	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(*Claims); ok && token.Valid {
		return claims, nil
	}

	return nil, jwt.ErrSignatureInvalid
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
