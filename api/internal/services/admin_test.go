package services

import (
	"context"
	"testing"

	api "redrawn/api/internal/api"
	"redrawn/api/internal/testutil"
)

func TestAdminPriceCRUD_BehindInterface(t *testing.T) {
	a := testutil.NewTestApp(t)
	defer testutil.CloseTestApp(t, a)
	svc := NewAdminService(a)

	// Create
	p, err := svc.CreatePrice(
		context.Background(),
		api.CreatePriceRequest{Name: "Pack", StripePriceID: "price_123", Credits: 5, Active: true},
	)
	if err != nil {
		t.Fatalf("create price: %v", err)
	}
	// Update
	newName := "Pack Pro"
	updated, err := svc.UpdatePrice(
		context.Background(),
		p.ID,
		api.UpdatePriceRequest{Name: &newName},
	)
	if err != nil {
		t.Fatalf("update price: %v", err)
	}
	if updated.Name != newName {
		t.Fatalf("expected updated name, got %s", updated.Name)
	}
	// ListAll
	items, err := svc.ListAllPrices(context.Background())
	if err != nil || len(items) == 0 {
		t.Fatalf("list prices: %v len=%d", err, len(items))
	}
	// Delete
	if err := svc.DeletePrice(context.Background(), p.ID); err != nil {
		t.Fatalf("delete price: %v", err)
	}
}
