package db

import (
	"context"

	"redrawn/api/internal/generated"
)

// WithTx executes fn within a database transaction.
// It begins a transaction, passes it to fn, and commits on success or rolls back on error.
func WithTx(
	ctx context.Context,
	client *generated.Client,
	fn func(ctx context.Context, tx *generated.Tx) error,
) error {
	tx, err := client.Tx(ctx)
	if err != nil {
		return err
	}
	// Ensure rollback if fn panics or returns error before commit
	defer func() { _ = tx.Rollback() }()

	if err := fn(ctx, tx); err != nil {
		return err
	}
	return tx.Commit()
}
