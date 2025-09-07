package main

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/go-fuego/fuego"

	"redrawn/api/internal/api"
	"redrawn/api/internal/middleware"
	"redrawn/api/internal/testutil"
)

// helper to perform a request against a fuego.Server
func doRequest(t *testing.T, s *fuego.Server, req *http.Request) *httptest.ResponseRecorder {
	t.Helper()
	rr := httptest.NewRecorder()
	s.Handler.ServeHTTP(rr, req)
	return rr
}

func TestHealthEndpoint(t *testing.T) {
	a := testutil.NewTestApp(t)
	defer testutil.CloseTestApp(t, a)
	s := fuego.NewServer()
	registerRoutes(s, a)

	req := httptest.NewRequest(http.MethodGet, "/v1/health", nil)
	rr := httptest.NewRecorder()
	s.Handler.ServeHTTP(rr, req)
	if rr.Code != http.StatusOK {
		t.Fatalf("unexpected status: %d body=%s", rr.Code, rr.Body.String())
	}
	var got map[string]string
	if err := json.Unmarshal(rr.Body.Bytes(), &got); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if got["status"] != "ok" {
		t.Fatalf("unexpected body: %+v", got)
	}
}

func TestAuthVerifySetsCookieAndCreatesUser(t *testing.T) {
	a := testutil.NewTestApp(t)
	defer testutil.CloseTestApp(t, a)
	s := fuego.NewServer()
	registerRoutes(s, a)

	body := map[string]string{"token": "user1@example.com"}
	b, _ := json.Marshal(body)
	req := httptest.NewRequest(http.MethodPost, "/v1/auth/verify", bytes.NewReader(b))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()
	s.Handler.ServeHTTP(rr, req)
	if rr.Code != http.StatusOK {
		t.Fatalf("status=%d body=%s", rr.Code, rr.Body.String())
	}
	// Session cookie should be set
	if sc := rr.Header().Get("Set-Cookie"); sc == "" {
		t.Fatalf("expected Set-Cookie header")
	}
}

func TestRequireAuthMiddlewareBlocksWithoutSession(t *testing.T) {
	a := testutil.NewTestApp(t)
	defer testutil.CloseTestApp(t, a)
	s := fuego.NewServer()
	// only register a protected group to test middleware
	grp := fuego.Group(s, "")
	fuego.Use(grp, middleware.RequireAuth)
	// trivial handler under group
	fuego.Get(grp, "/v1/me", func(c fuego.ContextNoBody) (map[string]string, error) {
		return map[string]string{"ok": "true"}, nil
	})

	req := httptest.NewRequest(http.MethodGet, "/v1/me", nil)
	rr := httptest.NewRecorder()
	s.Handler.ServeHTTP(rr, req)
	if rr.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", rr.Code)
	}
}

func TestUsersMeWithSession(t *testing.T) {
	a := testutil.NewTestApp(t)
	defer testutil.CloseTestApp(t, a)
	s := fuego.NewServer()
	// global session and logger middlewares to mimic main
	fuego.Use(s, middleware.SessionMiddleware(a.Config))
	fuego.Use(s, middleware.RequestLogger)
	registerRoutes(s, a)

	// Create a user and attach session cookie
	uid := testutil.MustCreateUser(t, a, "tester@example.com")
	cookie := middleware.MakeSessionCookie(a.Config, uid)

	req := httptest.NewRequest(http.MethodGet, "/v1/me", nil)
	req.AddCookie(cookie)
	rr := httptest.NewRecorder()
	s.Handler.ServeHTTP(rr, req)
	if rr.Code != http.StatusOK {
		t.Fatalf("status=%d body=%s", rr.Code, rr.Body.String())
	}
	var got struct{ Email string }
	if err := json.Unmarshal(rr.Body.Bytes(), &got); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if got.Email != "tester@example.com" {
		t.Fatalf("unexpected email: %s", got.Email)
	}
}

func TestTaskStatusOK(t *testing.T) {
	a := testutil.NewTestApp(t)
	defer testutil.CloseTestApp(t, a)
	s := fuego.NewServer()
	// global middlewares
	fuego.Use(s, middleware.SessionMiddleware(a.Config))
	fuego.Use(s, middleware.RequestLogger)
	registerRoutes(s, a)

	// Enqueue a fake job to get an id and status
	id, err := a.Queue.EnqueueGenerate(context.TODO(), api.GenerateJobPayload{Task: "generate"})
	if err != nil {
		t.Fatalf("enqueue: %v", err)
	}
	// Set any session cookie; middleware will accept it without DB lookup
	cookie := middleware.MakeSessionCookie(a.Config, "u_test")

	req := httptest.NewRequest(http.MethodGet, "/v1/tasks/"+id, nil)
	req.AddCookie(cookie)
	rr := httptest.NewRecorder()
	s.Handler.ServeHTTP(rr, req)
	if rr.Code != http.StatusOK {
		t.Fatalf("status=%d body=%s", rr.Code, rr.Body.String())
	}
	var got struct{ Status string }
	if err := json.Unmarshal(rr.Body.Bytes(), &got); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if got.Status != "queued" {
		t.Fatalf("unexpected status: %s", got.Status)
	}
}

// end
