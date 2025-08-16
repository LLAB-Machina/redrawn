package middleware

import (
	"log/slog"
	"net/http"
	"time"

	"redrawn/api/internal/app"
)

// RequestLogger attaches a request-scoped *slog.Logger to the context with useful attributes.
func RequestLogger(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		logger := slog.Default().With(
			slog.String("method", r.Method),
			slog.String("path", r.URL.Path),
		)
		if uid, ok := app.UserIDFromContext(r.Context()); ok {
			logger = logger.With(slog.String("user_id", uid))
		}
		ctx := app.SetLogger(r.Context(), logger)
		rw := &statusWriter{ResponseWriter: w, status: 200}
		next.ServeHTTP(rw, r.WithContext(ctx))
		logger.Info(
			"request",
			slog.Int("status", rw.status),
			slog.Duration("dur", time.Since(start)),
		)
	})
}

type statusWriter struct {
	http.ResponseWriter
	status int
}

func (w *statusWriter) WriteHeader(code int) { w.status = code; w.ResponseWriter.WriteHeader(code) }
