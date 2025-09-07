package services

import (
	"context"
	"testing"

	"redrawn/api/internal/testutil"
)

func TestThemesCreateAndList(t *testing.T) {
	a := testutil.NewTestApp(t)
	defer testutil.CloseTestApp(t, a)
	svc := NewThemesService(a)

	_, err := svc.Create(context.Background(), "Studio", "Clean backdrop")
	if err != nil {
		t.Fatalf("Create: %v", err)
	}
	items, err := svc.List(context.Background())
	if err != nil {
		t.Fatalf("List: %v", err)
	}
	if len(items) == 0 {
		t.Fatalf("expected non-empty themes list")
	}
}
