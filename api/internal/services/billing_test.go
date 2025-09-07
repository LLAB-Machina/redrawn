package services

import (
	"context"
	"testing"

	"redrawn/api/internal/testutil"
)

func TestBillingCreateCheckoutSession_NoStripeConfigured(t *testing.T) {
	a := testutil.NewTestApp(t)
	defer testutil.CloseTestApp(t, a)
	svc := NewBillingService(a)
	if _, err := svc.CreateCheckoutSession(context.Background(), ""); err == nil {
		t.Fatalf("expected error when stripe client not configured")
	}
}
