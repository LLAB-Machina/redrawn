package services

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"time"

	"github.com/google/uuid"
)

// Theme represents a photo theme with CSS tokens and prompts
type Theme struct {
	ID             string          `json:"id"`
	GroupID        string          `json:"group_id"`
	Name           string          `json:"name"`
	Description    *string         `json:"description,omitempty"`
	CSSTokens      json.RawMessage `json:"css_tokens,omitempty"`
	PromptTemplate *string         `json:"prompt_template,omitempty"`
	IsPublic       bool            `json:"is_public"`
	UserID         *string         `json:"user_id,omitempty"`
	Status         string          `json:"status"`
	CreatedAt      time.Time       `json:"created_at"`
	ConfirmedAt    *time.Time      `json:"confirmed_at,omitempty"`
}

// CreateThemeInput holds data for creating a theme
type CreateThemeInput struct {
	UserID         string          `json:"user_id" validate:"required"`
	Name           string          `json:"name" validate:"required"`
	Description    *string         `json:"description,omitempty"`
	CSSTokens      json.RawMessage `json:"css_tokens,omitempty"`
	PromptTemplate *string         `json:"prompt_template,omitempty"`
	IsPublic       bool            `json:"is_public"`
}

// UpdateThemeInput holds data for updating a theme
type UpdateThemeInput struct {
	ID             string          `json:"id" validate:"required"`
	Name           *string         `json:"name,omitempty"`
	Description    *string         `json:"description,omitempty"`
	CSSTokens      json.RawMessage `json:"css_tokens,omitempty"`
	PromptTemplate *string         `json:"prompt_template,omitempty"`
	IsPublic       *bool           `json:"is_public,omitempty"`
}

// ThemeService handles theme business logic
type ThemeService struct {
	db *sql.DB
}

// NewThemeService creates a new ThemeService
func NewThemeService(db *sql.DB) *ThemeService {
	return &ThemeService{db: db}
}

// Create creates a new theme with staging pattern
func (s *ThemeService) Create(ctx context.Context, input CreateThemeInput) (*Theme, error) {
	groupID := uuid.New().String()
	themeID := uuid.New().String()
	now := time.Now()

	theme := &Theme{
		ID:             themeID,
		GroupID:        groupID,
		Name:           input.Name,
		Description:    input.Description,
		CSSTokens:      input.CSSTokens,
		PromptTemplate: input.PromptTemplate,
		IsPublic:       input.IsPublic,
		UserID:         &input.UserID,
		Status:         "staged",
		CreatedAt:      now,
	}

	_, err := s.db.ExecContext(ctx,
		`INSERT INTO themes (id, group_id, name, description, css_tokens, prompt_template, is_public, user_id, status, created_at)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
		theme.ID, theme.GroupID, theme.Name, theme.Description, theme.CSSTokens,
		theme.PromptTemplate, theme.IsPublic, theme.UserID, theme.Status, theme.CreatedAt,
	)
	if err != nil {
		return nil, err
	}

	return theme, nil
}

// GetByID retrieves a theme by ID
func (s *ThemeService) GetByID(ctx context.Context, id string) (*Theme, error) {
	theme := &Theme{}
	var description, promptTemplate, userID sql.NullString
	var cssTokens []byte
	var confirmedAt sql.NullTime

	err := s.db.QueryRowContext(ctx,
		`SELECT id, group_id, name, description, css_tokens, prompt_template, is_public, user_id, status, created_at, confirmed_at
		 FROM themes WHERE id = $1 AND status != 'deleted'`,
		id,
	).Scan(
		&theme.ID, &theme.GroupID, &theme.Name, &description, &cssTokens,
		&promptTemplate, &theme.IsPublic, &userID, &theme.Status, &theme.CreatedAt, &confirmedAt,
	)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, errors.New("theme not found")
		}
		return nil, err
	}

	if description.Valid {
		theme.Description = &description.String
	}
	if promptTemplate.Valid {
		theme.PromptTemplate = &promptTemplate.String
	}
	if userID.Valid {
		theme.UserID = &userID.String
	}
	if confirmedAt.Valid {
		theme.ConfirmedAt = &confirmedAt.Time
	}
	if len(cssTokens) > 0 {
		theme.CSSTokens = cssTokens
	}

	return theme, nil
}

// GetByGroupID retrieves the latest confirmed theme by group ID
func (s *ThemeService) GetByGroupID(ctx context.Context, groupID string) (*Theme, error) {
	theme := &Theme{}
	var description, promptTemplate, userID sql.NullString
	var cssTokens []byte
	var confirmedAt sql.NullTime

	err := s.db.QueryRowContext(ctx,
		`SELECT id, group_id, name, description, css_tokens, prompt_template, is_public, user_id, status, created_at, confirmed_at
		 FROM themes WHERE group_id = $1 AND status = 'confirmed' ORDER BY confirmed_at DESC NULLS LAST LIMIT 1`,
		groupID,
	).Scan(
		&theme.ID, &theme.GroupID, &theme.Name, &description, &cssTokens,
		&promptTemplate, &theme.IsPublic, &userID, &theme.Status, &theme.CreatedAt, &confirmedAt,
	)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, errors.New("theme not found")
		}
		return nil, err
	}

	if description.Valid {
		theme.Description = &description.String
	}
	if promptTemplate.Valid {
		theme.PromptTemplate = &promptTemplate.String
	}
	if userID.Valid {
		theme.UserID = &userID.String
	}
	if confirmedAt.Valid {
		theme.ConfirmedAt = &confirmedAt.Time
	}
	if len(cssTokens) > 0 {
		theme.CSSTokens = cssTokens
	}

	return theme, nil
}

// ListByUser lists all themes for a user (owned or public)
func (s *ThemeService) ListByUser(ctx context.Context, userID string) ([]Theme, error) {
	rows, err := s.db.QueryContext(ctx,
		`SELECT id, group_id, name, description, css_tokens, prompt_template, is_public, user_id, status, created_at, confirmed_at
		 FROM themes 
		 WHERE status != 'deleted' AND (user_id = $1 OR is_public = true)
		 ORDER BY created_at DESC`,
		userID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var themes []Theme
	for rows.Next() {
		var theme Theme
		var description, promptTemplate, uid sql.NullString
		var cssTokens []byte
		var confirmedAt sql.NullTime

		err := rows.Scan(
			&theme.ID, &theme.GroupID, &theme.Name, &description, &cssTokens,
			&promptTemplate, &theme.IsPublic, &uid, &theme.Status, &theme.CreatedAt, &confirmedAt,
		)
		if err != nil {
			return nil, err
		}

		if description.Valid {
			theme.Description = &description.String
		}
		if promptTemplate.Valid {
			theme.PromptTemplate = &promptTemplate.String
		}
		if uid.Valid {
			theme.UserID = &uid.String
		}
		if confirmedAt.Valid {
			theme.ConfirmedAt = &confirmedAt.Time
		}
		if len(cssTokens) > 0 {
			theme.CSSTokens = cssTokens
		}

		themes = append(themes, theme)
	}

	return themes, rows.Err()
}

// ListPublic lists all public themes
func (s *ThemeService) ListPublic(ctx context.Context) ([]Theme, error) {
	rows, err := s.db.QueryContext(ctx,
		`SELECT id, group_id, name, description, css_tokens, prompt_template, is_public, user_id, status, created_at, confirmed_at
		 FROM themes 
		 WHERE is_public = true AND status = 'confirmed'
		 ORDER BY created_at DESC`,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var themes []Theme
	for rows.Next() {
		var theme Theme
		var description, promptTemplate, userID sql.NullString
		var cssTokens []byte
		var confirmedAt sql.NullTime

		err := rows.Scan(
			&theme.ID, &theme.GroupID, &theme.Name, &description, &cssTokens,
			&promptTemplate, &theme.IsPublic, &userID, &theme.Status, &theme.CreatedAt, &confirmedAt,
		)
		if err != nil {
			return nil, err
		}

		if description.Valid {
			theme.Description = &description.String
		}
		if promptTemplate.Valid {
			theme.PromptTemplate = &promptTemplate.String
		}
		if userID.Valid {
			theme.UserID = &userID.String
		}
		if confirmedAt.Valid {
			theme.ConfirmedAt = &confirmedAt.Time
		}
		if len(cssTokens) > 0 {
			theme.CSSTokens = cssTokens
		}

		themes = append(themes, theme)
	}

	return themes, rows.Err()
}

// Update updates a theme (creates new version for confirmed themes)
func (s *ThemeService) Update(ctx context.Context, input UpdateThemeInput) (*Theme, error) {
	// Get current theme
	current, err := s.GetByID(ctx, input.ID)
	if err != nil {
		return nil, err
	}

	// If staged, update in place
	if current.Status == "staged" {
		return s.updateInPlace(ctx, current, input)
	}

	// If confirmed, create new version
	return s.createNewVersion(ctx, current, input)
}

func (s *ThemeService) updateInPlace(ctx context.Context, current *Theme, input UpdateThemeInput) (*Theme, error) {
	name := current.Name
	if input.Name != nil {
		name = *input.Name
	}
	description := current.Description
	if input.Description != nil {
		description = input.Description
	}
	cssTokens := current.CSSTokens
	if input.CSSTokens != nil {
		cssTokens = input.CSSTokens
	}
	promptTemplate := current.PromptTemplate
	if input.PromptTemplate != nil {
		promptTemplate = input.PromptTemplate
	}
	isPublic := current.IsPublic
	if input.IsPublic != nil {
		isPublic = *input.IsPublic
	}

	_, err := s.db.ExecContext(ctx,
		`UPDATE themes SET name = $1, description = $2, css_tokens = $3, prompt_template = $4, is_public = $5 WHERE id = $6`,
		name, description, cssTokens, promptTemplate, isPublic, current.ID,
	)
	if err != nil {
		return nil, err
	}

	return s.GetByID(ctx, current.ID)
}

func (s *ThemeService) createNewVersion(ctx context.Context, current *Theme, input UpdateThemeInput) (*Theme, error) {
	newID := uuid.New().String()
	now := time.Now()

	name := current.Name
	if input.Name != nil {
		name = *input.Name
	}
	description := current.Description
	if input.Description != nil {
		description = input.Description
	}
	cssTokens := current.CSSTokens
	if input.CSSTokens != nil {
		cssTokens = input.CSSTokens
	}
	promptTemplate := current.PromptTemplate
	if input.PromptTemplate != nil {
		promptTemplate = input.PromptTemplate
	}
	isPublic := current.IsPublic
	if input.IsPublic != nil {
		isPublic = *input.IsPublic
	}

	// Mark old as deleted
	_, err := s.db.ExecContext(ctx,
		`UPDATE themes SET status = 'deleted' WHERE id = $1`,
		current.ID,
	)
	if err != nil {
		return nil, err
	}

	// Create new version
	theme := &Theme{
		ID:             newID,
		GroupID:        current.GroupID,
		Name:           name,
		Description:    description,
		CSSTokens:      cssTokens,
		PromptTemplate: promptTemplate,
		IsPublic:       isPublic,
		UserID:         current.UserID,
		Status:         "confirmed",
		CreatedAt:      now,
		ConfirmedAt:    &now,
	}

	_, err = s.db.ExecContext(ctx,
		`INSERT INTO themes (id, group_id, name, description, css_tokens, prompt_template, is_public, user_id, status, created_at, confirmed_at)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
		theme.ID, theme.GroupID, theme.Name, theme.Description, theme.CSSTokens,
		theme.PromptTemplate, theme.IsPublic, theme.UserID, theme.Status, theme.CreatedAt, theme.ConfirmedAt,
	)
	if err != nil {
		return nil, err
	}

	return theme, nil
}

// Confirm confirms a staged theme
func (s *ThemeService) Confirm(ctx context.Context, id string) (*Theme, error) {
	now := time.Now()
	_, err := s.db.ExecContext(ctx,
		`UPDATE themes SET status = 'confirmed', confirmed_at = $1 WHERE id = $2 AND status = 'staged'`,
		now, id,
	)
	if err != nil {
		return nil, err
	}
	return s.GetByID(ctx, id)
}

// Delete soft-deletes a theme
func (s *ThemeService) Delete(ctx context.Context, id string) error {
	_, err := s.db.ExecContext(ctx,
		`UPDATE themes SET status = 'deleted' WHERE id = $1`,
		id,
	)
	return err
}

// CanUserModify checks if a user can modify a theme
func (s *ThemeService) CanUserModify(ctx context.Context, themeID, userID string) (bool, error) {
	var ownerID sql.NullString
	err := s.db.QueryRowContext(ctx,
		`SELECT user_id FROM themes WHERE id = $1 AND status != 'deleted'`,
		themeID,
	).Scan(&ownerID)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return false, errors.New("theme not found")
		}
		return false, err
	}

	if !ownerID.Valid {
		// System theme - only admins can modify (for now, reject)
		return false, nil
	}

	return ownerID.String == userID, nil
}
