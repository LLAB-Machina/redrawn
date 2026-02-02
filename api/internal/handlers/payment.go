package handlers

import (
	"encoding/json"
	"io"
	"net/http"
	"os"

	"github.com/go-fuego/fuego"
	"github.com/stripe/stripe-go/v76"

	"redrawn/internal/app"
)

// PaymentHandler handles payment-related HTTP requests
type PaymentHandler struct {
	app *app.App
}

// NewPaymentHandler creates a new PaymentHandler
func NewPaymentHandler(a *app.App) *PaymentHandler {
	return &PaymentHandler{app: a}
}

// PurchaseCreditsRequest represents a request to purchase credits
type PurchaseCreditsRequest struct {
	Amount        int    `json:"amount" validate:"required,oneof=10 50 200"`
	PaymentMethod string `json:"payment_method" validate:"required,oneof=stripe paypal"`
}

// PurchaseCreditsResponse represents the response for a credit purchase
type PurchaseCreditsResponse struct {
	CheckoutURL  string `json:"checkout_url,omitempty"`
	ClientSecret string `json:"client_secret,omitempty"`
	SessionID    string `json:"session_id,omitempty"`
}

// PurchaseCredits initiates a credit purchase
func (h *PaymentHandler) PurchaseCredits(c fuego.ContextWithBody[PurchaseCreditsRequest]) (PurchaseCreditsResponse, error) {
	userID := c.Context().Value("user_id").(string)

	req, err := c.Body()
	if err != nil {
		return PurchaseCreditsResponse{}, err
	}

	// Build success/cancel URLs from request origin
	origin := c.Header("Origin")
	if origin == "" {
		origin = "http://localhost:3000"
	}

	successURL := origin + "/credits/success?session_id={CHECKOUT_SESSION_ID}"
	cancelURL := origin + "/credits"

	session, err := h.app.PaymentService.CreateCheckoutSession(
		c.Context(),
		userID,
		req.Amount,
		successURL,
		cancelURL,
	)
	if err != nil {
		return PurchaseCreditsResponse{}, fuego.BadRequestError{Detail: err.Error()}
	}

	return PurchaseCreditsResponse{
		CheckoutURL: session.URL,
		SessionID:   session.ID,
	}, nil
}

// StripeWebhook handles Stripe webhook events
func (h *PaymentHandler) StripeWebhook(c fuego.ContextNoBody) (map[string]string, error) {
	payload, err := io.ReadAll(c.Request().Body)
	if err != nil {
		return nil, fuego.BadRequestError{Detail: "failed to read body"}
	}

	signature := c.Header("Stripe-Signature")
	if signature == "" {
		return nil, fuego.BadRequestError{Detail: "missing stripe-signature header"}
	}

	event, err := h.app.PaymentService.HandleWebhook(payload, signature)
	if err != nil {
		return nil, fuego.BadRequestError{Detail: err.Error()}
	}

	// Handle the event
	switch event.Type {
	case "checkout.session.completed":
		var session stripe.CheckoutSession
		if err := json.Unmarshal(event.Data.Raw, &session); err != nil {
			return nil, fuego.BadRequestError{Detail: "failed to parse session"}
		}
		
		if err := h.app.PaymentService.ProcessCheckoutCompleted(c.Context(), &session); err != nil {
			// Log error but return 200 to prevent Stripe retries for unrecoverable errors
			return map[string]string{"status": "error", "message": err.Error()}, nil
		}

	case "checkout.session.async_payment_succeeded":
		// Handle async payment success (e.g., bank transfers)
		var session stripe.CheckoutSession
		if err := json.Unmarshal(event.Data.Raw, &session); err != nil {
			return nil, fuego.BadRequestError{Detail: "failed to parse session"}
		}
		
		if err := h.app.PaymentService.ProcessCheckoutCompleted(c.Context(), &session); err != nil {
			return map[string]string{"status": "error", "message": err.Error()}, nil
		}

	case "checkout.session.expired":
		// Session expired, no action needed

	default:
		// Unhandled event type
	}

	return map[string]string{"status": "success"}, nil
}

// RegisterRoutes registers payment routes with the server
func (h *PaymentHandler) RegisterRoutes(s *fuego.Server) {
	// User routes
	fuego.Post(s, "/credits/purchase", h.PurchaseCredits,
		fuego.OptionTags("Payments"),
		fuego.OptionOperationID("purchase_credits"),
		fuego.OptionDescription("Initiate a credit purchase via Stripe"),
	)

	// Webhook route (no auth required)
	fuego.Post(s, "/webhooks/stripe", h.StripeWebhook,
		fuego.OptionTags("Webhooks"),
		fuego.OptionOperationID("stripe_webhook"),
		fuego.OptionDescription("Handle Stripe webhook events"),
	)
}

// getEnv returns environment variable or default value
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
