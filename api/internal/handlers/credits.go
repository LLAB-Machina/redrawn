package handlers

import (
	"net/http"
	"strconv"

	"github.com/go-fuego/fuego"

	"redrawn/internal/app"
)

// CreditHandler handles credit-related HTTP requests
type CreditHandler struct {
	app *app.App
}

// NewCreditHandler creates a new CreditHandler
func NewCreditHandler(a *app.App) *CreditHandler {
	return &CreditHandler{app: a}
}

// CreditResponse represents a credit balance response
type CreditResponse struct {
	ID        string `json:"id"`
	UserID    string `json:"user_id"`
	Balance   int    `json:"balance"`
	CreatedAt string `json:"created_at"`
	UpdatedAt string `json:"updated_at"`
}

// CreditTransactionResponse represents a transaction in the response
type CreditTransactionResponse struct {
	ID                string  `json:"id"`
	Amount            int     `json:"amount"`
	Type              string  `json:"type"`
	Description       *string `json:"description,omitempty"`
	RelatedEntityType *string `json:"related_entity_type,omitempty"`
	RelatedEntityID   *string `json:"related_entity_id,omitempty"`
	CreatedAt         string  `json:"created_at"`
}

// TransactionHistoryResponse represents the transaction history response
type TransactionHistoryResponse struct {
	Transactions []CreditTransactionResponse `json:"transactions"`
}

// GetBalance returns the current user's credit balance
func (h *CreditHandler) GetBalance(c fuego.ContextNoBody) (CreditResponse, error) {
	userID := c.Context().Value("user_id").(string)

	credit, err := h.app.CreditService.GetBalance(c.Context(), userID)
	if err != nil {
		return CreditResponse{}, err
	}

	return CreditResponse{
		ID:        credit.ID,
		UserID:    credit.UserID,
		Balance:   credit.Balance,
		CreatedAt: credit.CreatedAt.Format(http.TimeFormat),
		UpdatedAt: credit.UpdatedAt.Format(http.TimeFormat),
	}, nil
}

// GetTransactionHistory returns the user's credit transaction history
func (h *CreditHandler) GetTransactionHistory(c fuego.ContextNoBody) (TransactionHistoryResponse, error) {
	userID := c.Context().Value("user_id").(string)

	// Parse limit parameter
	limitStr := c.QueryParam("limit")
	limit := 50
	if limitStr != "" {
		if parsed, err := strconv.Atoi(limitStr); err == nil && parsed > 0 {
			limit = parsed
		}
	}

	transactions, err := h.app.CreditService.GetTransactionHistory(c.Context(), userID, limit)
	if err != nil {
		return TransactionHistoryResponse{}, err
	}

	response := TransactionHistoryResponse{
		Transactions: make([]CreditTransactionResponse, len(transactions)),
	}
	for i, t := range transactions {
		response.Transactions[i] = CreditTransactionResponse{
			ID:                t.ID,
			Amount:            t.Amount,
			Type:              t.Type,
			Description:       t.Description,
			RelatedEntityType: t.RelatedEntityType,
			RelatedEntityID:   t.RelatedEntityID,
			CreatedAt:         t.CreatedAt.Format(http.TimeFormat),
		}
	}

	return response, nil
}

// AdminAddCreditsRequest represents a request to add credits (admin only)
type AdminAddCreditsRequest struct {
	Amount            int     `json:"amount" validate:"required,gt=0"`
	Type              string  `json:"type" validate:"required,oneof=purchase refund bonus"`
	Description       *string `json:"description,omitempty"`
	RelatedEntityType *string `json:"related_entity_type,omitempty"`
	RelatedEntityID   *string `json:"related_entity_id,omitempty"`
}

// AdminAddCredits adds credits to a user (admin only)
func (h *CreditHandler) AdminAddCredits(c fuego.ContextWithBody[AdminAddCreditsRequest]) (CreditResponse, error) {
	// TODO: Add admin authorization check

	targetUserID := c.PathParam("user_id")
	if targetUserID == "" {
		return CreditResponse{}, fuego.BadRequestError{Detail: "user_id required"}
	}

	req, err := c.Body()
	if err != nil {
		return CreditResponse{}, err
	}

	credit, err := h.app.CreditService.AddCredits(
		c.Context(),
		targetUserID,
		req.Amount,
		req.Type,
		req.Description,
		req.RelatedEntityType,
		req.RelatedEntityID,
	)
	if err != nil {
		return CreditResponse{}, fuego.BadRequestError{Detail: err.Error()}
	}

	return CreditResponse{
		ID:        credit.ID,
		UserID:    credit.UserID,
		Balance:   credit.Balance,
		CreatedAt: credit.CreatedAt.Format(http.TimeFormat),
		UpdatedAt: credit.UpdatedAt.Format(http.TimeFormat),
	}, nil
}

// AdminGetUserBalance returns a specific user's balance (admin only)
func (h *CreditHandler) AdminGetUserBalance(c fuego.ContextNoBody) (CreditResponse, error) {
	// TODO: Add admin authorization check

	targetUserID := c.PathParam("user_id")
	if targetUserID == "" {
		return CreditResponse{}, fuego.BadRequestError{Detail: "user_id required"}
	}

	credit, err := h.app.CreditService.GetBalance(c.Context(), targetUserID)
	if err != nil {
		return CreditResponse{}, err
	}

	return CreditResponse{
		ID:        credit.ID,
		UserID:    credit.UserID,
		Balance:   credit.Balance,
		CreatedAt: credit.CreatedAt.Format(http.TimeFormat),
		UpdatedAt: credit.UpdatedAt.Format(http.TimeFormat),
	}, nil
}

// AdminGetUserTransactions returns a specific user's transaction history (admin only)
func (h *CreditHandler) AdminGetUserTransactions(c fuego.ContextNoBody) (TransactionHistoryResponse, error) {
	// TODO: Add admin authorization check

	targetUserID := c.PathParam("user_id")
	if targetUserID == "" {
		return TransactionHistoryResponse{}, fuego.BadRequestError{Detail: "user_id required"}
	}

	// Parse limit parameter
	limitStr := c.QueryParam("limit")
	limit := 50
	if limitStr != "" {
		if parsed, err := strconv.Atoi(limitStr); err == nil && parsed > 0 {
			limit = parsed
		}
	}

	transactions, err := h.app.CreditService.GetTransactionHistory(c.Context(), targetUserID, limit)
	if err != nil {
		return TransactionHistoryResponse{}, err
	}

	response := TransactionHistoryResponse{
		Transactions: make([]CreditTransactionResponse, len(transactions)),
	}
	for i, t := range transactions {
		response.Transactions[i] = CreditTransactionResponse{
			ID:                t.ID,
			Amount:            t.Amount,
			Type:              t.Type,
			Description:       t.Description,
			RelatedEntityType: t.RelatedEntityType,
			RelatedEntityID:   t.RelatedEntityID,
			CreatedAt:         t.CreatedAt.Format(http.TimeFormat),
		}
	}

	return response, nil
}

// RegisterRoutes registers credit routes with the server
func (h *CreditHandler) RegisterRoutes(s *fuego.Server) {
	// User routes
	fuego.Get(s, "/credits/balance", h.GetBalance,
		fuego.OptionTags("Credits"),
		fuego.OptionOperationID("get_credit_balance"),
		fuego.OptionDescription("Get current user's credit balance"),
	)
	fuego.Get(s, "/credits/transactions", h.GetTransactionHistory,
		fuego.OptionTags("Credits"),
		fuego.OptionOperationID("get_credit_transactions"),
		fuego.OptionDescription("Get current user's credit transaction history"),
		fuego.OptionQuery("limit", "Maximum number of transactions to return (default 50, max 100)"),
	)

	// Admin routes
	fuego.Get(s, "/admin/users/{user_id}/credits", h.AdminGetUserBalance,
		fuego.OptionTags("Admin"),
		fuego.OptionOperationID("admin_get_user_credits"),
		fuego.OptionDescription("Get a specific user's credit balance (admin only)"),
	)
	fuego.Post(s, "/admin/users/{user_id}/credits", h.AdminAddCredits,
		fuego.OptionTags("Admin"),
		fuego.OptionOperationID("admin_add_credits"),
		fuego.OptionDescription("Add credits to a user (admin only)"),
	)
	fuego.Get(s, "/admin/users/{user_id}/credit-transactions", h.AdminGetUserTransactions,
		fuego.OptionTags("Admin"),
		fuego.OptionOperationID("admin_get_user_transactions"),
		fuego.OptionDescription("Get a specific user's transaction history (admin only)"),
		fuego.OptionQuery("limit", "Maximum number of transactions to return (default 50, max 100)"),
	)
}
