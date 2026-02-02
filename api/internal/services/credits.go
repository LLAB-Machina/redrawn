package services

import (
	"context"
	"database/sql"
	"errors"
	"time"

	"github.com/google/uuid"
)

// Credit represents a user's credit balance
type Credit struct {
	ID        string    `json:"id"`
	UserID    string    `json:"user_id"`
	Balance   int       `json:"balance"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// CreditTransaction represents a credit transaction history entry
type CreditTransaction struct {
	ID                string    `json:"id"`
	UserID            string    `json:"user_id"`
	Amount            int       `json:"amount"` // positive for purchase/bonus/refund, negative for usage
	Type              string    `json:"type"`   // purchase, usage, refund, bonus
	Description       *string   `json:"description,omitempty"`
	RelatedEntityType *string   `json:"related_entity_type,omitempty"`
	RelatedEntityID   *string   `json:"related_entity_id,omitempty"`
	CreatedAt         time.Time `json:"created_at"`
}

// CreditService handles credit balance and transaction history
type CreditService struct {
	db *sql.DB
}

// NewCreditService creates a new CreditService
func NewCreditService(db *sql.DB) *CreditService {
	return &CreditService{db: db}
}

// GetBalance retrieves the current credit balance for a user
func (s *CreditService) GetBalance(ctx context.Context, userID string) (*Credit, error) {
	credit := &Credit{}
	err := s.db.QueryRowContext(ctx,
		`SELECT id, user_id, balance, created_at, updated_at
		 FROM credits WHERE user_id = $1`,
		userID,
	).Scan(
		&credit.ID, &credit.UserID, &credit.Balance, &credit.CreatedAt, &credit.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			// Return zero balance for new users
			return &Credit{
				UserID:    userID,
				Balance:   0,
				CreatedAt: time.Now(),
				UpdatedAt: time.Now(),
			}, nil
		}
		return nil, err
	}
	return credit, nil
}

// ensureCreditRecord ensures a credit record exists for the user
func (s *CreditService) ensureCreditRecord(ctx context.Context, userID string) (string, error) {
	// Try to get existing
	var id string
	err := s.db.QueryRowContext(ctx,
		`SELECT id FROM credits WHERE user_id = $1`,
		userID,
	).Scan(&id)
	if err == nil {
		return id, nil
	}
	if !errors.Is(err, sql.ErrNoRows) {
		return "", err
	}

	// Create new credit record
	id = uuid.New().String()
	now := time.Now()
	_, err = s.db.ExecContext(ctx,
		`INSERT INTO credits (id, user_id, balance, created_at, updated_at)
		 VALUES ($1, $2, 0, $3, $3)`,
		id, userID, now,
	)
	if err != nil {
		return "", err
	}
	return id, nil
}

// AddCredits adds credits to a user's balance (for purchases, bonuses, refunds)
func (s *CreditService) AddCredits(ctx context.Context, userID string, amount int, txType string, description *string, relatedEntityType, relatedEntityID *string) (*Credit, error) {
	if amount <= 0 {
		return nil, errors.New("amount must be positive")
	}
	if txType != "purchase" && txType != "bonus" && txType != "refund" {
		return nil, errors.New("invalid transaction type for adding credits")
	}

	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	// Ensure credit record exists
	creditID, err := s.ensureCreditRecord(ctx, userID)
	if err != nil {
		return nil, err
	}

	// Update balance
	now := time.Now()
	_, err = tx.ExecContext(ctx,
		`UPDATE credits SET balance = balance + $1, updated_at = $2 WHERE id = $3`,
		amount, now, creditID,
	)
	if err != nil {
		return nil, err
	}

	// Record transaction
	transactionID := uuid.New().String()
	_, err = tx.ExecContext(ctx,
		`INSERT INTO credit_transactions (id, user_id, amount, type, description, related_entity_type, related_entity_id, created_at)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
		transactionID, userID, amount, txType, description, relatedEntityType, relatedEntityID, now,
	)
	if err != nil {
		return nil, err
	}

	if err := tx.Commit(); err != nil {
		return nil, err
	}

	return s.GetBalance(ctx, userID)
}

// DeductCredits deducts credits from a user's balance (for usage)
func (s *CreditService) DeductCredits(ctx context.Context, userID string, amount int, description *string, relatedEntityType, relatedEntityID *string) (*Credit, error) {
	if amount <= 0 {
		return nil, errors.New("amount must be positive")
	}

	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	// Ensure credit record exists and check balance
	creditID, err := s.ensureCreditRecord(ctx, userID)
	if err != nil {
		return nil, err
	}

	// Check sufficient balance
	var currentBalance int
	err = tx.QueryRowContext(ctx,
		`SELECT balance FROM credits WHERE id = $1 FOR UPDATE`,
		creditID,
	).Scan(&currentBalance)
	if err != nil {
		return nil, err
	}
	if currentBalance < amount {
		return nil, errors.New("insufficient credits")
	}

	// Deduct balance
	now := time.Now()
	_, err = tx.ExecContext(ctx,
		`UPDATE credits SET balance = balance - $1, updated_at = $2 WHERE id = $3`,
		amount, now, creditID,
	)
	if err != nil {
		return nil, err
	}

	// Record transaction (negative amount for usage)
	transactionID := uuid.New().String()
	_, err = tx.ExecContext(ctx,
		`INSERT INTO credit_transactions (id, user_id, amount, type, description, related_entity_type, related_entity_id, created_at)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
		transactionID, userID, -amount, "usage", description, relatedEntityType, relatedEntityID, now,
	)
	if err != nil {
		return nil, err
	}

	if err := tx.Commit(); err != nil {
		return nil, err
	}

	return s.GetBalance(ctx, userID)
}

// GetTransactionHistory retrieves credit transaction history for a user
func (s *CreditService) GetTransactionHistory(ctx context.Context, userID string, limit int) ([]CreditTransaction, error) {
	if limit <= 0 {
		limit = 50
	}
	if limit > 100 {
		limit = 100
	}

	rows, err := s.db.QueryContext(ctx,
		`SELECT id, user_id, amount, type, description, related_entity_type, related_entity_id, created_at
		 FROM credit_transactions
		 WHERE user_id = $1
		 ORDER BY created_at DESC
		 LIMIT $2`,
		userID, limit,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	return s.scanTransactions(rows)
}

// GetTransactionByID retrieves a specific transaction by ID
func (s *CreditService) GetTransactionByID(ctx context.Context, transactionID string) (*CreditTransaction, error) {
	transaction := &CreditTransaction{}
	var desc, relType, relID sql.NullString

	err := s.db.QueryRowContext(ctx,
		`SELECT id, user_id, amount, type, description, related_entity_type, related_entity_id, created_at
		 FROM credit_transactions WHERE id = $1`,
		transactionID,
	).Scan(
		&transaction.ID, &transaction.UserID, &transaction.Amount, &transaction.Type,
		&desc, &relType, &relID, &transaction.CreatedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}

	if desc.Valid {
		transaction.Description = &desc.String
	}
	if relType.Valid {
		transaction.RelatedEntityType = &relType.String
	}
	if relID.Valid {
		transaction.RelatedEntityID = &relID.String
	}

	return transaction, nil
}

// scanTransactions scans rows into CreditTransaction slice
func (s *CreditService) scanTransactions(rows *sql.Rows) ([]CreditTransaction, error) {
	var transactions []CreditTransaction
	for rows.Next() {
		var t CreditTransaction
		var desc, relType, relID sql.NullString

		err := rows.Scan(
			&t.ID, &t.UserID, &t.Amount, &t.Type,
			&desc, &relType, &relID, &t.CreatedAt,
		)
		if err != nil {
			return nil, err
		}

		if desc.Valid {
			t.Description = &desc.String
		}
		if relType.Valid {
			t.RelatedEntityType = &relType.String
		}
		if relID.Valid {
			t.RelatedEntityID = &relID.String
		}

		transactions = append(transactions, t)
	}
	return transactions, rows.Err()
}
