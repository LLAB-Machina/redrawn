package handlers

import (
	"io"

	"redrawn/api/internal/api"
	"redrawn/api/internal/app"
	"redrawn/api/internal/services"

	"github.com/go-fuego/fuego"
	"github.com/go-fuego/fuego/option"
)

func RegisterBilling(s *fuego.Server, a *app.App) {
	service := services.NewBillingService(a)

	fuego.Post(
		s,
		"/create-checkout-session",
		func(c fuego.ContextWithBody[api.CreateCheckoutSessionRequest]) (api.URLResponse, error) {
			body, err := BindAndValidate(c)
			if err != nil {
				return api.URLResponse{}, err
			}
			url, err := service.CreateCheckoutSession(c.Context(), body.PriceID)
			if err != nil {
				return api.URLResponse{}, err
			}
			return api.URLResponse{URL: url}, nil
		},
		option.Summary("Create Stripe checkout session"),
		option.OperationID("CreateCheckoutSession"),
	)

	// List active prices for display on pricing page
	fuego.Get(s, "/prices", func(c fuego.ContextNoBody) ([]api.Price, error) {
		return service.ListActivePrices(c.Context())
	}, option.Summary("List active prices"), option.OperationID("ListActivePrices"))

	fuego.Post(s, "/stripe/webhook", func(c fuego.ContextNoBody) (api.OkResponse, error) {
		r := c.Request()
		body, err := io.ReadAll(r.Body)
		if err != nil {
			return api.OkResponse{}, err
		}
		sig := r.Header.Get("Stripe-Signature")
		if err := service.HandleStripeWebhook(c.Context(), body, sig); err != nil {
			return api.OkResponse{}, err
		}
		return api.OkResponse{Ok: "true"}, nil
	}, option.Summary("Stripe webhook"), option.OperationID("StripeWebhook"))
}
