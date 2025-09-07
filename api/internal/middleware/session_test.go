package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"redrawn/api/internal/app"
	"redrawn/api/internal/config"
)

func TestSessionMiddlewareSetsUserID(t *testing.T) {
	cfg := config.Config{SessionSecret: "secret"}
	uid := "user_123"
	cookie := MakeSessionCookie(cfg, uid)

	var got string
	h := SessionMiddleware(cfg)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if id, ok := app.UserIDFromContext(r.Context()); ok {
			got = id
		}
		w.WriteHeader(http.StatusOK)
	}))

	rr := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.AddCookie(cookie)
	h.ServeHTTP(rr, req)

	if got != uid {
		t.Fatalf("expected user id %q in context, got %q", uid, got)
	}
}
