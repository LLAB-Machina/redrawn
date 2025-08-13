package services

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"os"
	"time"

	"redrawn/api/ent"
	"redrawn/api/ent/user"
	"redrawn/api/internal/app"

	"github.com/google/uuid"

	stripe "github.com/stripe/stripe-go/v76"
	"github.com/stripe/stripe-go/v76/checkout/session"
	"github.com/stripe/stripe-go/v76/webhook"
)

type BillingService struct{ app *app.App }

func NewBillingService(a *app.App) *BillingService { return &BillingService{app: a} }

func (s *BillingService) CreateCheckoutSession(ctx context.Context) (string, error) {
	priceID := s.app.Config.StripePriceID
	if priceID == "" {
		return "", errors.New("stripe price id missing")
	}
	key := s.app.Config.StripeSecretKey
	if key == "" {
		key = os.Getenv("STRIPE_SECRET_KEY")
	}
	if key == "" {
		return "", errors.New("stripe secret missing")
	}
	stripe.Key = key
	params := &stripe.CheckoutSessionParams{
		Mode:       stripe.String(string(stripe.CheckoutSessionModeSubscription)),
		SuccessURL: stripe.String(s.app.Config.PublicBaseURL + "/billing?success=1"),
		CancelURL:  stripe.String(s.app.Config.PublicBaseURL + "/billing?canceled=1"),
		LineItems: []*stripe.CheckoutSessionLineItemParams{
			{Price: stripe.String(priceID), Quantity: stripe.Int64(1)},
		},
	}

	// Attach user identity to the checkout session for mapping on webhook
	if uid, ok := app.UserIDFromContext(ctx); ok {
		params.ClientReferenceID = stripe.String(uid)
		// Set customer if we already have one
		if uUUID, err := uuidFromString(uid); err == nil {
			if u, err := s.app.Ent.User.Get(ctx, uUUID); err == nil {
				if u.StripeCustomerID != "" {
					params.Customer = stripe.String(u.StripeCustomerID)
				} else {
					// Provide email to let Stripe prefill customer
					if u.Email != "" {
						params.CustomerEmail = stripe.String(u.Email)
					}
				}
			}
		}
	}
	cs, err := session.New(params)
	if err != nil {
		return "", err
	}
	return cs.URL, nil
}

func (s *BillingService) HandleStripeWebhook(ctx context.Context, payload []byte, signatureHeader string) error {
	secret := s.app.Config.StripeWebhook
	if secret == "" {
		return errors.New("stripe webhook secret missing")
	}

	event, err := webhook.ConstructEventWithOptions(
		payload,
		signatureHeader,
		secret,
		webhook.ConstructEventOptions{Tolerance: 5 * time.Minute},
	)
	if err != nil {
		return fmt.Errorf("invalid webhook signature: %w", err)
	}

	switch event.Type {
	case "checkout.session.completed":
		var cs stripe.CheckoutSession
		if err := json.Unmarshal(event.Data.Raw, &cs); err != nil {
			return fmt.Errorf("unmarshal checkout.session: %w", err)
		}
		if err := s.handleCheckoutCompleted(ctx, &cs); err != nil {
			return err
		}
	case "customer.subscription.created", "customer.subscription.updated":
		var sub stripe.Subscription
		if err := json.Unmarshal(event.Data.Raw, &sub); err != nil {
			return fmt.Errorf("unmarshal subscription: %w", err)
		}
		if err := s.handleSubscriptionUpsert(ctx, &sub); err != nil {
			return err
		}
	case "customer.subscription.deleted":
		var sub stripe.Subscription
		if err := json.Unmarshal(event.Data.Raw, &sub); err != nil {
			return fmt.Errorf("unmarshal subscription: %w", err)
		}
		if err := s.handleSubscriptionDeleted(ctx, &sub); err != nil {
			return err
		}
	case "invoice.payment_succeeded":
		var inv stripe.Invoice
		if err := json.Unmarshal(event.Data.Raw, &inv); err != nil {
			return fmt.Errorf("unmarshal invoice: %w", err)
		}
		if err := s.handleInvoicePaid(ctx, &inv); err != nil {
			return err
		}
	case "invoice.payment_failed":
		var inv stripe.Invoice
		if err := json.Unmarshal(event.Data.Raw, &inv); err != nil {
			return fmt.Errorf("unmarshal invoice: %w", err)
		}
		slog.Warn("invoice payment failed", slog.String("invoice", inv.ID), slog.String("customer", inv.Customer.ID))
	default:
		slog.Info("stripe webhook ignored", slog.String("type", string(event.Type)), slog.String("id", event.ID))
	}

	return nil
}

func (s *BillingService) handleCheckoutCompleted(ctx context.Context, cs *stripe.CheckoutSession) error {
	// Prefer client_reference_id to locate user
	var userToUpdate *ent.User
	if cs.ClientReferenceID != "" {
		uid, err := uuidFromString(cs.ClientReferenceID)
		if err == nil {
			u, err := s.app.Ent.User.Get(ctx, uid)
			if err == nil {
				userToUpdate = u
			}
		}
	}
	// Fallback by customer email
	if userToUpdate == nil && cs.CustomerEmail != "" {
		u, err := s.app.Ent.User.Query().Where(user.EmailEQ(cs.CustomerEmail)).Only(ctx)
		if err == nil {
			userToUpdate = u
		}
	}
	if userToUpdate == nil {
		return errors.New("could not find user for checkout session")
	}

	upd := s.app.Ent.User.UpdateOneID(userToUpdate.ID)
	if cs.Customer != nil && cs.Customer.ID != "" {
		upd.SetStripeCustomerID(cs.Customer.ID)
	}
	if cs.Subscription != nil {
		upd.SetStripeSubID(cs.Subscription.ID)
	}
	upd.SetPlan("pro")
	upd.AddCredits(int64(s.creditsPerCycle()))
	if err := upd.Exec(ctx); err != nil {
		return err
	}
	slog.Info("checkout completed applied", slog.String("user", userToUpdate.ID.String()))
	return nil
}

func (s *BillingService) handleSubscriptionUpsert(ctx context.Context, sub *stripe.Subscription) error {
	if sub == nil || sub.Customer.ID == "" {
		return nil
	}
	u, err := s.app.Ent.User.Query().Where(user.StripeCustomerIDEQ(sub.Customer.ID)).Only(ctx)
	if err != nil {
		return err
	}
	plan := "free"
	if sub.Status == stripe.SubscriptionStatusActive || sub.Status == stripe.SubscriptionStatusTrialing {
		plan = "pro"
	}
	if err := s.app.Ent.User.UpdateOneID(u.ID).SetPlan(plan).SetStripeSubID(sub.ID).Exec(ctx); err != nil {
		return err
	}
	slog.Info("subscription upserted", slog.String("user", u.ID.String()), slog.String("plan", plan))
	return nil
}

func (s *BillingService) handleSubscriptionDeleted(ctx context.Context, sub *stripe.Subscription) error {
	if sub == nil || sub.Customer.ID == "" {
		return nil
	}
	u, err := s.app.Ent.User.Query().Where(user.StripeCustomerIDEQ(sub.Customer.ID)).Only(ctx)
	if err != nil {
		return err
	}
	if err := s.app.Ent.User.UpdateOneID(u.ID).SetPlan("free").SetStripeSubID("").Exec(ctx); err != nil {
		return err
	}
	slog.Info("subscription deleted", slog.String("user", u.ID.String()))
	return nil
}

func (s *BillingService) handleInvoicePaid(ctx context.Context, inv *stripe.Invoice) error {
	if inv == nil || inv.Customer.ID == "" {
		return nil
	}
	u, err := s.app.Ent.User.Query().Where(user.StripeCustomerIDEQ(inv.Customer.ID)).Only(ctx)
	if err != nil {
		return err
	}
	if err := s.app.Ent.User.UpdateOneID(u.ID).AddCredits(int64(s.creditsPerCycle())).Exec(ctx); err != nil {
		return err
	}
	slog.Info("invoice paid: topped up credits", slog.String("user", u.ID.String()))
	return nil
}

func (s *BillingService) creditsPerCycle() int {
	if s.app.Config.CreditsPerCycle > 0 {
		return s.app.Config.CreditsPerCycle
	}
	return 1000
}

// uuidFromString wraps uuid.Parse without importing here in header to avoid collisions
func uuidFromString(sid string) (uuid.UUID, error) { return uuid.Parse(sid) }
