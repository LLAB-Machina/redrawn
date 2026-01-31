package app

import "context"

// ctxKey is a private type for context keys
type ctxKey int

const (
	appKey ctxKey = iota
)

// WithApp adds the App to the context
func WithApp(ctx context.Context, app *App) context.Context {
	return context.WithValue(ctx, appKey, app)
}

// FromContext retrieves the App from context
func FromContext(ctx context.Context) *App {
	if app, ok := ctx.Value(appKey).(*App); ok {
		return app
	}
	return nil
}
