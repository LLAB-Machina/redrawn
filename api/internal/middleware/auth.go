package middleware

import (
	"net/http"

	"redrawn/api/internal/app"
	"redrawn/api/internal/errorsx"
)

// RequireAuth ensures a valid session is present and a user id is set in context.
func RequireAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if _, ok := app.UserIDFromContext(r.Context()); !ok {
			// Let fuego map this to 401 via global error handler
			http.Error(w, errorsx.ErrUnauthorized.Error(), http.StatusUnauthorized)
			return
		}
		next.ServeHTTP(w, r)
	})
}

// AdminOnly restricts access to configured admin emails.
func AdminOnly(a *app.App) func(next http.Handler) http.Handler {
	allowed := map[string]struct{}{}
	for _, e := range a.Config.AdminEmails {
		allowed[e] = struct{}{}
	}
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			uid, ok := app.UserIDFromContext(r.Context())
			if !ok || uid == "" {
				http.Error(w, errorsx.ErrUnauthorized.Error(), http.StatusUnauthorized)
				return
			}
			u, err := a.Db.User.Get(r.Context(), uid)
			if err != nil {
				http.Error(w, errorsx.ErrUnauthorized.Error(), http.StatusUnauthorized)
				return
			}
			if _, ok := allowed[u.Email]; !ok {
				http.Error(w, errorsx.ErrForbidden.Error(), http.StatusForbidden)
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}
