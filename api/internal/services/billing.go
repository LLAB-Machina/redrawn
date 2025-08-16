package services

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"strconv"
	"time"

	stripe "github.com/stripe/stripe-go/v82"
	"github.com/stripe/stripe-go/v82/webhook"

	"redrawn/api/internal/api"
	"redrawn/api/internal/app"
	"redrawn/api/internal/generated"
	pricepred "redrawn/api/internal/generated/price"
	"redrawn/api/internal/generated/user"
)

type BillingService struct{ app *app.App }

func NewBillingService(a *app.App) *BillingService { return &BillingService{app: a} }

func (s *BillingService) CreateCheckoutSession(
	ctx context.Context,
	appPriceID string,
) (string, error) {
	if s.app.Stripe == nil {
		return "", errors.New("stripe client not configured")
	}
	var stripePriceID string
	var credits int
	var priceID *string
	if appPriceID != "" {
		p, err := s.app.Db.Price.Get(ctx, appPriceID)
		if err != nil {
			return "", fmt.Errorf("price not found: %w", err)
		}
		stripePriceID = p.StripePriceID
		credits = p.Credits
		pid := p.ID
		priceID = &pid
	} else {
		// fallback to configured single price
		stripePriceID = s.app.Config.StripePriceID
		if stripePriceID == "" {
			return "", errors.New("stripe price id missing")
		}
		credits = s.app.Config.CreditsPerPurchase
	}

	params := &stripe.CheckoutSessionCreateParams{
		Mode:       stripe.String(string(stripe.CheckoutSessionModePayment)),
		SuccessURL: stripe.String(s.app.Config.PublicBaseURL + "/billing?success=1"),
		CancelURL:  stripe.String(s.app.Config.PublicBaseURL + "/billing?canceled=1"),
		LineItems: []*stripe.CheckoutSessionCreateLineItemParams{
			{Price: stripe.String(stripePriceID), Quantity: stripe.Int64(1)},
		},
	}
	if params.Metadata == nil {
		params.Metadata = map[string]string{}
	}
	params.Metadata["credits"] = fmt.Sprintf("%d", credits)
	if priceID != nil {
		params.Metadata["price_id"] = *priceID
	}

	// Attach user identity to the checkout session for mapping on webhook
	if uid, ok := app.UserIDFromContext(ctx); ok {
		params.ClientReferenceID = stripe.String(uid)
		// Set customer if we already have one
		if u, err := s.app.Db.User.Get(ctx, uid); err == nil {
			if u.StripeCustomerID != "" {
				params.Customer = stripe.String(u.StripeCustomerID)
			} else if u.Email != "" {
				params.CustomerEmail = stripe.String(u.Email)
			}
		}
	}

	cs, err := s.app.Stripe.V1CheckoutSessions.Create(ctx, params)
	if err != nil {
		return "", err
	}
	return cs.URL, nil
}

func (s *BillingService) HandleStripeWebhook(
	ctx context.Context,
	payload []byte,
	signatureHeader string,
) error {
	secret := s.app.Config.StripeWebhook
	if secret == "" {
		return errors.New("stripe webhook secret missing")
	}
	event, err := webhook.ConstructEventWithOptions(
		payload,
		signatureHeader,
		secret,
		webhook.ConstructEventOptions{Tolerance: 5 * time.Minute, IgnoreAPIVersionMismatch: true},
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
	default:
		slog.Info(
			"stripe webhook ignored",
			slog.String("type", string(event.Type)),
			slog.String("id", event.ID),
		)
	}
	return nil
}

func (s *BillingService) handleCheckoutCompleted(
	ctx context.Context,
	cs *stripe.CheckoutSession,
) error {
	// Prefer client_reference_id to locate user
	var userToUpdate *generated.User
	if cs.ClientReferenceID != "" {
		u, err := s.app.Db.User.Get(ctx, cs.ClientReferenceID)
		if err == nil {
			userToUpdate = u
		}
	}
	// Fallback by customer email
	if userToUpdate == nil && cs.CustomerEmail != "" {
		u, err := s.app.Db.User.Query().Where(user.EmailEQ(cs.CustomerEmail)).Only(ctx)
		if err == nil {
			userToUpdate = u
		}
	}
	if userToUpdate == nil {
		return errors.New("could not find user for checkout session")
	}

	upd := s.app.Db.User.UpdateOneID(userToUpdate.ID)
	if cs.Customer != nil && cs.Customer.ID != "" {
		upd.SetStripeCustomerID(cs.Customer.ID)
	}
	// Determine credits from session metadata if present; else fallback to config
	addCredits := int64(s.app.Config.CreditsPerPurchase)
	if cs.Metadata != nil {
		if v, ok := cs.Metadata["credits"]; ok {
			if n, err := strconv.ParseInt(v, 10, 64); err == nil && n > 0 {
				addCredits = n
			}
		}
	}
	// One-off purchase: add credits only
	upd.AddCredits(addCredits)
	if err := upd.Exec(ctx); err != nil {
		return err
	}
	// Save purchase record
	var priceID *string
	if cs.Metadata != nil {
		if v, ok := cs.Metadata["price_id"]; ok {
			pid := v
			priceID = &pid
		}
	}
	pc := s.app.Db.Purchase.Create().
		SetUserID(userToUpdate.ID).
		SetStripeCheckoutSessionID(cs.ID).
		SetCreditsGranted(addCredits)
	if priceID != nil {
		pc = pc.SetPriceID(*priceID)
	}
	if cs.Customer != nil && cs.Customer.ID != "" {
		pc = pc.SetStripeCustomerID(cs.Customer.ID)
	}
	if cs.PaymentIntent != nil && cs.PaymentIntent.ID != "" {
		pc = pc.SetStripePaymentIntentID(cs.PaymentIntent.ID)
	}
	if cs.AmountTotal > 0 {
		pc = pc.SetAmountTotal(cs.AmountTotal)
	}
	if cs.Currency != "" {
		pc = pc.SetCurrency(string(cs.Currency))
	}
	if _, err := pc.Save(ctx); err != nil {
		slog.Error("purchase save failed", slog.String("err", err.Error()))
	}

	slog.Info("checkout completed applied", slog.String("user", userToUpdate.ID))
	return nil
}

// ListActivePrices returns active prices mapped to API model
func (s *BillingService) ListActivePrices(ctx context.Context) ([]api.Price, error) {
	rows, err := s.app.Db.Price.Query().Where(pricepred.ActiveEQ(true)).All(ctx)
	if err != nil {
		return nil, err
	}
	out := make([]api.Price, 0, len(rows))
	for _, r := range rows {
		out = append(out, api.Price{
			ID:            r.ID,
			Name:          r.Name,
			StripePriceID: r.StripePriceID,
			Credits:       r.Credits,
			Active:        r.Active,
		})
	}
	return out, nil
}
