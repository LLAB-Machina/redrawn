package services

import (
	"context"
	"errors"
	"fmt"

	"github.com/stripe/stripe-go/v76"
	"github.com/stripe/stripe-go/v76/checkout/session"
	"github.com/stripe/stripe-go/v76/webhook"
)

// PaymentService handles payment processing via Stripe
type PaymentService struct {
	stripeKey     string
	webhookSecret string
	creditService *CreditService
}

// CreditPackage represents a credit purchase package
type CreditPackage struct {
	Amount  int
	Price   int64 // Price in cents
	Credits int
}

// Available credit packages (must match frontend)
var CreditPackages = map[int]CreditPackage{
	10:  {Amount: 10, Price: 500, Credits: 10},   // $5.00
	50:  {Amount: 50, Price: 2000, Credits: 50},  // $20.00
	200: {Amount: 200, Price: 6000, Credits: 200}, // $60.00
}

// NewPaymentService creates a new PaymentService
func NewPaymentService(stripeKey, webhookSecret string, creditService *CreditService) *PaymentService {
	stripe.Key = stripeKey
	return &PaymentService{
		stripeKey:     stripeKey,
		webhookSecret: webhookSecret,
		creditService: creditService,
	}
}

// CreateCheckoutSession creates a Stripe checkout session for credit purchase
func (s *PaymentService) CreateCheckoutSession(ctx context.Context, userID string, packageAmount int, successURL, cancelURL string) (*stripe.CheckoutSession, error) {
	pkg, ok := CreditPackages[packageAmount]
	if !ok {
		return nil, errors.New("invalid credit package")
	}

	params := &stripe.CheckoutSessionParams{
		PaymentMethodTypes: stripe.StringSlice([]string{"card"}),
		LineItems: []*stripe.CheckoutSessionLineItemParams{
			{
				PriceData: &stripe.CheckoutSessionLineItemPriceDataParams{
					Currency: stripe.String("usd"),
					ProductData: &stripe.CheckoutSessionLineItemPriceDataProductDataParams{
						Name:        stripe.String(fmt.Sprintf("%d Credits", pkg.Credits)),
						Description: stripe.String(fmt.Sprintf("%d credits for AI photo generation", pkg.Credits)),
					},
					UnitAmount: stripe.Int64(pkg.Price),
				},
				Quantity: stripe.Int64(1),
			},
		},
		Mode:       stripe.String(string(stripe.CheckoutSessionModePayment)),
		SuccessURL: stripe.String(successURL),
		CancelURL:  stripe.String(cancelURL),
		Metadata: map[string]string{
			"user_id":        userID,
			"credit_amount":  fmt.Sprintf("%d", pkg.Credits),
			"package_amount": fmt.Sprintf("%d", packageAmount),
		},
	}

	session, err := session.New(params)
	if err != nil {
		return nil, fmt.Errorf("failed to create checkout session: %w", err)
	}

	return session, nil
}

// HandleWebhook processes Stripe webhook events
func (s *PaymentService) HandleWebhook(payload []byte, signature string) (*stripe.Event, error) {
	event, err := webhook.ConstructEvent(payload, signature, s.webhookSecret)
	if err != nil {
		return nil, fmt.Errorf("webhook verification failed: %w", err)
	}

	return &event, nil
}

// ProcessCheckoutCompleted handles checkout.session.completed event
func (s *PaymentService) ProcessCheckoutCompleted(ctx context.Context, session *stripe.CheckoutSession) error {
	userID, ok := session.Metadata["user_id"]
	if !ok {
		return errors.New("user_id not found in session metadata")
	}

	creditAmountStr, ok := session.Metadata["credit_amount"]
	if !ok {
		return errors.New("credit_amount not found in session metadata")
	}

	var creditAmount int
	if _, err := fmt.Sscanf(creditAmountStr, "%d", &creditAmount); err != nil {
		return fmt.Errorf("invalid credit_amount: %w", err)
	}

	description := fmt.Sprintf("Purchase via Stripe (Session: %s)", session.ID)

	_, err := s.creditService.AddCredits(
		ctx,
		userID,
		creditAmount,
		"purchase",
		&description,
		stripe.String("stripe_session"),
		stripe.String(session.ID),
	)

	return err
}

// GetPackage returns a credit package by amount
func (s *PaymentService) GetPackage(amount int) (CreditPackage, bool) {
	pkg, ok := CreditPackages[amount]
	return pkg, ok
}
