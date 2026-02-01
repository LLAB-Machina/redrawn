package handlers

import (
	"encoding/json"
	"errors"

	"github.com/go-fuego/fuego"
	"redrawn/internal/app"
	"redrawn/internal/services"
)

// ThemeHandler handles theme routes
type ThemeHandler struct {
	app *app.App
}

// NewThemeHandler creates a new ThemeHandler
func NewThemeHandler(a *app.App) *ThemeHandler {
	return &ThemeHandler{app: a}
}

// RegisterRoutes registers theme routes
func (h *ThemeHandler) RegisterRoutes(s *fuego.Server) {
	// Theme CRUD
	fuego.Get(s, "/themes", h.List,
		fuego.OptionTags("Themes"),
		fuego.OptionOperationID("listThemes"),
		fuego.OptionDescription("List all themes for the current user (including public themes)"),
	)
	fuego.Get(s, "/themes/public", h.ListPublic,
		fuego.OptionTags("Themes"),
		fuego.OptionOperationID("listPublicThemes"),
		fuego.OptionDescription("List all public themes"),
	)
	fuego.Post(s, "/themes", h.Create,
		fuego.OptionTags("Themes"),
		fuego.OptionOperationID("createTheme"),
		fuego.OptionDescription("Create a new theme"),
	)
	fuego.Get(s, "/themes/{id}", h.Get,
		fuego.OptionTags("Themes"),
		fuego.OptionOperationID("getTheme"),
		fuego.OptionDescription("Get a theme by ID"),
	)
	fuego.Put(s, "/themes/{id}", h.Update,
		fuego.OptionTags("Themes"),
		fuego.OptionOperationID("updateTheme"),
		fuego.OptionDescription("Update a theme"),
	)
	fuego.Delete(s, "/themes/{id}", h.Delete,
		fuego.OptionTags("Themes"),
		fuego.OptionOperationID("deleteTheme"),
		fuego.OptionDescription("Delete a theme"),
	)

	// Theme actions
	fuego.Post(s, "/themes/{id}/confirm", h.Confirm,
		fuego.OptionTags("Themes"),
		fuego.OptionOperationID("confirmTheme"),
		fuego.OptionDescription("Confirm a staged theme"),
	)
}

// ListThemesResponse is the response for listing themes
type ListThemesResponse struct {
	Themes []services.Theme `json:"themes"`
}

// List lists all themes for the current user
func (h *ThemeHandler) List(c *fuego.ContextNoBody) (ListThemesResponse, error) {
	userID := getUserIDFromContext(c.Context())
	if userID == "" {
		return ListThemesResponse{}, errors.New("unauthorized")
	}

	themes, err := h.app.ThemeService.ListByUser(c.Context(), userID)
	if err != nil {
		return ListThemesResponse{}, err
	}

	return ListThemesResponse{Themes: themes}, nil
}

// ListPublic lists all public themes
func (h *ThemeHandler) ListPublic(c *fuego.ContextNoBody) (ListThemesResponse, error) {
	themes, err := h.app.ThemeService.ListPublic(c.Context())
	if err != nil {
		return ListThemesResponse{}, err
	}

	return ListThemesResponse{Themes: themes}, nil
}

// CreateThemeRequest is the request for creating a theme
type CreateThemeRequest struct {
	Name           string          `json:"name" validate:"required"`
	Description    *string         `json:"description,omitempty"`
	CSSTokens      json.RawMessage `json:"css_tokens,omitempty"`
	PromptTemplate *string         `json:"prompt_template,omitempty"`
	IsPublic       bool            `json:"is_public"`
}

// CreateThemeResponse is the response for creating a theme
type CreateThemeResponse struct {
	Theme services.Theme `json:"theme"`
}

// Create creates a new theme
func (h *ThemeHandler) Create(c *fuego.ContextWithBody[CreateThemeRequest]) (CreateThemeResponse, error) {
	userID := getUserIDFromContext(c.Context())
	if userID == "" {
		return CreateThemeResponse{}, errors.New("unauthorized")
	}

	input, err := c.Body()
	if err != nil {
		return CreateThemeResponse{}, err
	}

	theme, err := h.app.ThemeService.Create(c.Context(), services.CreateThemeInput{
		UserID:         userID,
		Name:           input.Name,
		Description:    input.Description,
		CSSTokens:      input.CSSTokens,
		PromptTemplate: input.PromptTemplate,
		IsPublic:       input.IsPublic,
	})
	if err != nil {
		return CreateThemeResponse{}, err
	}

	return CreateThemeResponse{Theme: *theme}, nil
}

// GetThemeResponse is the response for getting a theme
type GetThemeResponse struct {
	Theme services.Theme `json:"theme"`
}

// Get gets a theme by ID
func (h *ThemeHandler) Get(c *fuego.ContextNoBody) (GetThemeResponse, error) {
	userID := getUserIDFromContext(c.Context())
	if userID == "" {
		return GetThemeResponse{}, errors.New("unauthorized")
	}

	id := c.PathParam("id")
	theme, err := h.app.ThemeService.GetByID(c.Context(), id)
	if err != nil {
		return GetThemeResponse{}, err
	}

	// Check if user has access (owner or public)
	if !theme.IsPublic && (theme.UserID == nil || *theme.UserID != userID) {
		return GetThemeResponse{}, errors.New("access denied")
	}

	return GetThemeResponse{Theme: *theme}, nil
}

// UpdateThemeRequest is the request for updating a theme
type UpdateThemeRequest struct {
	Name           *string         `json:"name,omitempty"`
	Description    *string         `json:"description,omitempty"`
	CSSTokens      json.RawMessage `json:"css_tokens,omitempty"`
	PromptTemplate *string         `json:"prompt_template,omitempty"`
	IsPublic       *bool           `json:"is_public,omitempty"`
}

// UpdateThemeResponse is the response for updating a theme
type UpdateThemeResponse struct {
	Theme services.Theme `json:"theme"`
}

// Update updates a theme
func (h *ThemeHandler) Update(c *fuego.ContextWithBody[UpdateThemeRequest]) (UpdateThemeResponse, error) {
	userID := getUserIDFromContext(c.Context())
	if userID == "" {
		return UpdateThemeResponse{}, errors.New("unauthorized")
	}

	id := c.PathParam("id")

	// Check if user has permission
	canModify, err := h.app.ThemeService.CanUserModify(c.Context(), id, userID)
	if err != nil {
		return UpdateThemeResponse{}, err
	}
	if !canModify {
		return UpdateThemeResponse{}, errors.New("insufficient permissions")
	}

	input, err := c.Body()
	if err != nil {
		return UpdateThemeResponse{}, err
	}

	theme, err := h.app.ThemeService.Update(c.Context(), services.UpdateThemeInput{
		ID:             id,
		Name:           input.Name,
		Description:    input.Description,
		CSSTokens:      input.CSSTokens,
		PromptTemplate: input.PromptTemplate,
		IsPublic:       input.IsPublic,
	})
	if err != nil {
		return UpdateThemeResponse{}, err
	}

	return UpdateThemeResponse{Theme: *theme}, nil
}

// Delete deletes a theme
func (h *ThemeHandler) Delete(c *fuego.ContextNoBody) (any, error) {
	userID := getUserIDFromContext(c.Context())
	if userID == "" {
		return nil, errors.New("unauthorized")
	}

	id := c.PathParam("id")

	// Check if user has permission
	canModify, err := h.app.ThemeService.CanUserModify(c.Context(), id, userID)
	if err != nil {
		return nil, err
	}
	if !canModify {
		return nil, errors.New("insufficient permissions")
	}

	if err := h.app.ThemeService.Delete(c.Context(), id); err != nil {
		return nil, err
	}

	return map[string]string{"status": "deleted"}, nil
}

// ConfirmThemeResponse is the response for confirming a theme
type ConfirmThemeResponse struct {
	Theme services.Theme `json:"theme"`
}

// Confirm confirms a staged theme
func (h *ThemeHandler) Confirm(c *fuego.ContextNoBody) (ConfirmThemeResponse, error) {
	userID := getUserIDFromContext(c.Context())
	if userID == "" {
		return ConfirmThemeResponse{}, errors.New("unauthorized")
	}

	id := c.PathParam("id")

	// Check if user has permission
	canModify, err := h.app.ThemeService.CanUserModify(c.Context(), id, userID)
	if err != nil {
		return ConfirmThemeResponse{}, err
	}
	if !canModify {
		return ConfirmThemeResponse{}, errors.New("insufficient permissions")
	}

	theme, err := h.app.ThemeService.Confirm(c.Context(), id)
	if err != nil {
		return ConfirmThemeResponse{}, err
	}

	return ConfirmThemeResponse{Theme: *theme}, nil
}
