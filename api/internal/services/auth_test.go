package services

import (
	"context"
	"testing"

	"redrawn/api/internal/testutil"
)

func TestAuthVerifyCreatesUserAndReturnsID(t *testing.T) {
	a := testutil.NewTestApp(t)
	defer testutil.CloseTestApp(t, a)
	svc := NewAuthService(a)

	id, err := svc.GoogleVerify(context.Background(), "authuser@example.com")
	if err != nil {
		t.Fatalf("verify: %v", err)
	}
	if id == "" {
		t.Fatalf("expected non-empty user id")
	}
	// calling again should return same id
	id2, err := svc.GoogleVerify(context.Background(), "authuser@example.com")
	if err != nil {
		t.Fatalf("verify second: %v", err)
	}
	if id2 != id {
		t.Fatalf("expected same id, got %s vs %s", id, id2)
	}
}
