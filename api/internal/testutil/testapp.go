package testutil

import (
	"context"
	"net"
	"net/url"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/go-fuego/fuego"
	_ "github.com/lib/pq"

	"redrawn/api/internal/app"
	"redrawn/api/internal/config"
	"redrawn/api/internal/generated"
	"redrawn/api/internal/generated/enttest"
)

// NewTestDB creates an in-memory SQLite Ent client and runs schema migrations.
func NewTestDB(t testing.TB) *generated.Client {
	t.Helper()
	dsn := os.Getenv("DATABASE_URL")
	require := strings.ToLower(os.Getenv("REQUIRE_DB_TESTS"))
	must := require == "1" || require == "true" || require == "yes"
	if dsn == "" {
		if must {
			t.Fatalf("DATABASE_URL not set and REQUIRE_DB_TESTS=1")
		}
		t.Skip("DATABASE_URL not set; skipping DB-backed tests")
	}
	if !isPostgresReachable(dsn) {
		if must {
			t.Fatalf("DATABASE_URL not reachable and REQUIRE_DB_TESTS=1: %s", dsn)
		}
		t.Skip("DATABASE_URL not reachable; skipping DB-backed tests")
	}
	return enttest.Open(t, "postgres", dsn)
}

// NewTestApp constructs an app.App with an in-memory DB and fake dependencies.
func NewTestApp(t testing.TB) *app.App {
	t.Helper()
	cfg := config.Config{
		Dev:                true,
		LogFormat:          "text",
		LogLevel:           "debug",
		SessionSecret:      "test-secret",
		PublicBaseURL:      "http://localhost:8080",
		CreditsPerPurchase: 10,
		AdminEmails:        []string{"admin@example.com"},
		// Fake R2 config to enable upload flows in tests
		R2AccessKeyID:     "test",
		R2SecretAccessKey: "test",
		R2Bucket:          "test-bucket",
		R2S3Endpoint:      "https://example.com",
		R2PublicBaseURL:   "https://cdn.example.com",
	}
	a := &app.App{Config: cfg}
	a.Db = NewTestDB(t)
	a.Storage = &FakeStorage{}
	a.Queue = NewFakeQueue()
	return a
}

// CloseTestApp closes resources associated with the test app.
func CloseTestApp(t testing.TB, a *app.App) {
	t.Helper()
	if a != nil && a.Db != nil {
		_ = a.Db.Close()
	}
}

// NewTestServer returns a fuego.Server configured similarly to production with routes registered.
// The caller can further customize middlewares if needed.
func NewTestServer(t testing.TB, a *app.App, configure func(s *fuego.Server)) *fuego.Server {
	t.Helper()
	s := fuego.NewServer()
	if configure != nil {
		configure(s)
	}
	// Routes will be registered by tests (cmd/api has access to registerRoutes)
	return s
}

// MustCreateUser creates a user in the test DB and returns its ID.
func MustCreateUser(t testing.TB, a *app.App, email string) string {
	t.Helper()
	u, err := a.Db.User.Create().SetEmail(email).SetCredits(10).Save(context.Background())
	if err != nil {
		t.Fatalf("create user: %v", err)
	}
	return u.ID
}

// isPostgresReachable makes a quick TCP connection attempt to the host:port from DSN.
func isPostgresReachable(dsn string) bool {
	u, err := url.Parse(dsn)
	if err != nil {
		return false
	}
	host := u.Host
	if host == "" {
		return false
	}
	c, err := net.DialTimeout("tcp", host, 500*time.Millisecond)
	if err != nil {
		return false
	}
	_ = c.Close()
	return true
}
