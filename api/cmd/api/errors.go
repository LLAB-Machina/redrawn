package main

import (
	"encoding/json"
	"errors"
	"net/http"
	"runtime/debug"
	"strings"

	"redrawn/api/internal/api"
	"redrawn/api/internal/config"

	"github.com/go-fuego/fuego"
)

// configureErrorHandling sets global error handling and logging middleware.
func configureErrorHandling(s *fuego.Server, cfg config.Config) {
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

	// Structured request/response logging (defaults)
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
}
