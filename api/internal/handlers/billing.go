package handlers

import (
	"io"

	"redrawn/api/internal/api"
	"redrawn/api/internal/app"
	"redrawn/api/internal/services"

	"github.com/go-fuego/fuego"
)

func RegisterBilling(s *fuego.Server, a *app.App) {
	svc := services.NewBillingService(a)

	fuego.Post(s, "/v1/billing/create-checkout-session", func(c fuego.ContextWithBody[api.CreateCheckoutSessionRequest]) (api.URLResponse, error) {
		body, err := c.Body()
		if err != nil {
			return api.URLResponse{}, err
		}
		url, err := svc.CreateCheckoutSession(c.Context(), body.PriceID)
		if err != nil {
			return api.URLResponse{}, err
		}
		return api.URLResponse{URL: url}, nil
	})

	// List active prices for display on pricing page
	fuego.Get(s, "/v1/billing/prices", func(c fuego.ContextNoBody) ([]api.Price, error) {
		return svc.ListActivePrices(c.Context())
	})

	fuego.Post(s, "/v1/stripe/webhook", func(c fuego.ContextNoBody) (api.OkResponse, error) {
		r := c.Request()
		body, err := io.ReadAll(r.Body)
		if err != nil {
			return api.OkResponse{}, err
		}
		sig := r.Header.Get("Stripe-Signature")
		if err := svc.HandleStripeWebhook(c.Context(), body, sig); err != nil {
			return api.OkResponse{}, err
		}
		return api.OkResponse{Ok: "true"}, nil
	})
}
