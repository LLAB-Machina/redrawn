package handlers

import (
	"errors"

	"github.com/go-fuego/fuego"
	"redrawn/internal/app"
	"redrawn/internal/services"
)

// GeneratedPhotoHandler handles generated photo routes
type GeneratedPhotoHandler struct {
	app *app.App
}

// NewGeneratedPhotoHandler creates a new GeneratedPhotoHandler
func NewGeneratedPhotoHandler(a *app.App) *GeneratedPhotoHandler {
	return &GeneratedPhotoHandler{app: a}
}

// RegisterRoutes registers generated photo routes
func (h *GeneratedPhotoHandler) RegisterRoutes(s *fuego.Server) {
	// Generated photo CRUD
	fuego.Get(s, "/generated-photos", h.List,
		fuego.OptionTags("Generated Photos"),
		fuego.OptionOperationID("listGeneratedPhotos"),
		fuego.OptionDescription("List all generated photos for the current user"),
	)
	fuego.Post(s, "/generated-photos", h.Create,
		fuego.OptionTags("Generated Photos"),
		fuego.OptionOperationID("createGeneratedPhoto"),
		fuego.OptionDescription("Queue a new themed photo generation"),
	)
	fuego.Get(s, "/generated-photos/{id}", h.Get,
		fuego.OptionTags("Generated Photos"),
		fuego.OptionOperationID("getGeneratedPhoto"),
		fuego.OptionDescription("Get a generated photo by ID"),
	)
	fuego.Put(s, "/generated-photos/{id}", h.Update,
		fuego.OptionTags("Generated Photos"),
		fuego.OptionOperationID("updateGeneratedPhoto"),
		fuego.OptionDescription("Update generated photo metadata"),
	)
	fuego.Delete(s, "/generated-photos/{id}", h.Delete,
		fuego.OptionTags("Generated Photos"),
		fuego.OptionOperationID("deleteGeneratedPhoto"),
		fuego.OptionDescription("Delete a generated photo"),
	)

	// Original photo specific routes
	fuego.Get(s, "/photos/{photoID}/generated", h.ListByOriginalPhoto,
		fuego.OptionTags("Generated Photos"),
		fuego.OptionOperationID("listGeneratedByOriginal"),
		fuego.OptionDescription("List all generated variants for an original photo"),
	)

	// Theme specific routes
	fuego.Get(s, "/themes/{themeID}/generated", h.ListByTheme,
		fuego.OptionTags("Generated Photos"),
		fuego.OptionOperationID("listGeneratedByTheme"),
		fuego.OptionDescription("List all generated photos using a theme"),
	)

	// Status management (for background workers)
	fuego.Post(s, "/generated-photos/{id}/status", h.UpdateStatus,
		fuego.OptionTags("Generated Photos"),
		fuego.OptionOperationID("updateGeneratedPhotoStatus"),
		fuego.OptionDescription("Update generation status (queued/processing/completed/error)"),
	)
}

// ListGeneratedPhotosResponse is the response for listing generated photos
type ListGeneratedPhotosResponse struct {
	GeneratedPhotos []services.GeneratedPhoto `json:"generated_photos"`
}

// List lists all generated photos for the current user
func (h *GeneratedPhotoHandler) List(c *fuego.ContextNoBody) (ListGeneratedPhotosResponse, error) {
	userID := getUserIDFromContext(c.Context())
	if userID == "" {
		return ListGeneratedPhotosResponse{}, errors.New("unauthorized")
	}

	generated, err := h.app.GeneratedPhotoService.ListByUser(c.Context(), userID)
	if err != nil {
		return ListGeneratedPhotosResponse{}, err
	}

	return ListGeneratedPhotosResponse{GeneratedPhotos: generated}, nil
}

// CreateGeneratedPhotoRequest is the request for creating a generated photo
type CreateGeneratedPhotoRequest struct {
	OriginalPhotoID string `json:"original_photo_id" validate:"required"`
	ThemeID         string `json:"theme_id" validate:"required"`
	StorageKey      string `json:"storage_key" validate:"required"`
	CreditsUsed     int    `json:"credits_used,omitempty"`
}

// Create queues a new photo generation
func (h *GeneratedPhotoHandler) Create(c *fuego.ContextWithBody[CreateGeneratedPhotoRequest]) (services.GeneratedPhoto, error) {
	userID := getUserIDFromContext(c.Context())
	if userID == "" {
		return services.GeneratedPhoto{}, errors.New("unauthorized")
	}

	req, err := c.Body()
	if err != nil {
		return services.GeneratedPhoto{}, err
	}

	// Get the original photo to check album access
	photo, err := h.app.PhotoService.GetByID(c.Context(), req.OriginalPhotoID)
	if err != nil {
		return services.GeneratedPhoto{}, errors.New("original photo not found")
	}
	if photo == nil {
		return services.GeneratedPhoto{}, errors.New("original photo not found")
	}

	// Check user has access to the album
	role, err := h.app.AlbumService.GetUserRole(c.Context(), photo.AlbumID, userID)
	if err != nil {
		return services.GeneratedPhoto{}, errors.New("access denied to album")
	}
	if role != "owner" && role != "admin" && role != "editor" {
		return services.GeneratedPhoto{}, errors.New("insufficient permissions")
	}

	// Verify theme exists and user can use it
	theme, err := h.app.ThemeService.GetByID(c.Context(), req.ThemeID)
	if err != nil {
		return services.GeneratedPhoto{}, errors.New("theme not found")
	}
	if theme == nil {
		return services.GeneratedPhoto{}, errors.New("theme not found")
	}
	if !theme.IsPublic && theme.UserID != nil && *theme.UserID != userID {
		return services.GeneratedPhoto{}, errors.New("cannot use private theme")
	}

	input := services.CreateGeneratedPhotoInput{
		OriginalPhotoID: req.OriginalPhotoID,
		ThemeID:         req.ThemeID,
		StorageKey:      req.StorageKey,
		CreditsUsed:     req.CreditsUsed,
	}

	generated, err := h.app.GeneratedPhotoService.Create(c.Context(), input)
	if err != nil {
		return services.GeneratedPhoto{}, err
	}

	return *generated, nil
}

// Get gets a generated photo by ID
func (h *GeneratedPhotoHandler) Get(c *fuego.ContextNoBody) (services.GeneratedPhoto, error) {
	userID := getUserIDFromContext(c.Context())
	if userID == "" {
		return services.GeneratedPhoto{}, errors.New("unauthorized")
	}

	id := c.PathParam("id")
	if id == "" {
		return services.GeneratedPhoto{}, errors.New("generated photo ID required")
	}

	generated, err := h.app.GeneratedPhotoService.GetByID(c.Context(), id)
	if err != nil {
		return services.GeneratedPhoto{}, err
	}
	if generated == nil {
		return services.GeneratedPhoto{}, errors.New("generated photo not found")
	}

	// Check user has access to the original photo's album
	photo, err := h.app.PhotoService.GetByID(c.Context(), generated.OriginalPhotoID)
	if err != nil {
		return services.GeneratedPhoto{}, err
	}

	role, err := h.app.AlbumService.GetUserRole(c.Context(), photo.AlbumID, userID)
	if err != nil {
		return services.GeneratedPhoto{}, errors.New("access denied")
	}
	if role == "" {
		return services.GeneratedPhoto{}, errors.New("access denied")
	}

	return *generated, nil
}

// UpdateGeneratedPhotoRequest is the request for updating a generated photo
type UpdateGeneratedPhotoRequest struct {
	StorageKey   *string `json:"storage_key,omitempty"`
	Status       *string `json:"status,omitempty"`
	CreditsUsed  *int    `json:"credits_used,omitempty"`
	ErrorMessage *string `json:"error_message,omitempty"`
}

// Update updates a generated photo
func (h *GeneratedPhotoHandler) Update(c *fuego.ContextWithBody[UpdateGeneratedPhotoRequest]) (services.GeneratedPhoto, error) {
	userID := getUserIDFromContext(c.Context())
	if userID == "" {
		return services.GeneratedPhoto{}, errors.New("unauthorized")
	}

	id := c.PathParam("id")
	if id == "" {
		return services.GeneratedPhoto{}, errors.New("generated photo ID required")
	}

	// Get current generated photo
	generated, err := h.app.GeneratedPhotoService.GetByID(c.Context(), id)
	if err != nil {
		return services.GeneratedPhoto{}, err
	}
	if generated == nil {
		return services.GeneratedPhoto{}, errors.New("generated photo not found")
	}

	// Check user owns the original photo
	photoOwnerID, err := h.app.GeneratedPhotoService.GetOriginalPhotoUserID(c.Context(), id)
	if err != nil {
		return services.GeneratedPhoto{}, err
	}
	if photoOwnerID != userID {
		return services.GeneratedPhoto{}, errors.New("only the photo owner can update generated variants")
	}

	req, err := c.Body()
	if err != nil {
		return services.GeneratedPhoto{}, err
	}

	input := services.UpdateGeneratedPhotoInput{
		ID:           id,
		StorageKey:   req.StorageKey,
		Status:       req.Status,
		CreditsUsed:  req.CreditsUsed,
		ErrorMessage: req.ErrorMessage,
	}

	updated, err := h.app.GeneratedPhotoService.Update(c.Context(), input)
	if err != nil {
		return services.GeneratedPhoto{}, err
	}

	return *updated, nil
}

// Delete deletes a generated photo
func (h *GeneratedPhotoHandler) Delete(c *fuego.ContextNoBody) (any, error) {
	userID := getUserIDFromContext(c.Context())
	if userID == "" {
		return nil, errors.New("unauthorized")
	}

	id := c.PathParam("id")
	if id == "" {
		return nil, errors.New("generated photo ID required")
	}

	// Check user owns the original photo
	photoOwnerID, err := h.app.GeneratedPhotoService.GetOriginalPhotoUserID(c.Context(), id)
	if err != nil {
		return nil, err
	}
	if photoOwnerID != userID {
		return nil, errors.New("only the photo owner can delete generated variants")
	}

	if err := h.app.GeneratedPhotoService.Delete(c.Context(), id); err != nil {
		return nil, err
	}

	return map[string]string{"status": "deleted"}, nil
}

// ListByOriginalPhoto lists generated variants for an original photo
func (h *GeneratedPhotoHandler) ListByOriginalPhoto(c *fuego.ContextNoBody) (ListGeneratedPhotosResponse, error) {
	userID := getUserIDFromContext(c.Context())
	if userID == "" {
		return ListGeneratedPhotosResponse{}, errors.New("unauthorized")
	}

	photoID := c.PathParam("photoID")
	if photoID == "" {
		return ListGeneratedPhotosResponse{}, errors.New("photo ID required")
	}

	// Get the photo to check album access
	photo, err := h.app.PhotoService.GetByID(c.Context(), photoID)
	if err != nil {
		return ListGeneratedPhotosResponse{}, errors.New("photo not found")
	}
	if photo == nil {
		return ListGeneratedPhotosResponse{}, errors.New("photo not found")
	}

	// Check user has access to the album
	role, err := h.app.AlbumService.GetUserRole(c.Context(), photo.AlbumID, userID)
	if err != nil {
		return ListGeneratedPhotosResponse{}, errors.New("access denied")
	}
	if role == "" {
		return ListGeneratedPhotosResponse{}, errors.New("access denied")
	}

	generated, err := h.app.GeneratedPhotoService.ListByOriginalPhoto(c.Context(), photoID)
	if err != nil {
		return ListGeneratedPhotosResponse{}, err
	}

	return ListGeneratedPhotosResponse{GeneratedPhotos: generated}, nil
}

// ListByTheme lists generated photos using a specific theme
func (h *GeneratedPhotoHandler) ListByTheme(c *fuego.ContextNoBody) (ListGeneratedPhotosResponse, error) {
	userID := getUserIDFromContext(c.Context())
	if userID == "" {
		return ListGeneratedPhotosResponse{}, errors.New("unauthorized")
	}

	themeID := c.PathParam("themeID")
	if themeID == "" {
		return ListGeneratedPhotosResponse{}, errors.New("theme ID required")
	}

	// Get the theme to check visibility
	theme, err := h.app.ThemeService.GetByID(c.Context(), themeID)
	if err != nil {
		return ListGeneratedPhotosResponse{}, errors.New("theme not found")
	}
	if theme == nil {
		return ListGeneratedPhotosResponse{}, errors.New("theme not found")
	}

	// If theme is private, only owner can see generated photos
	if !theme.IsPublic {
		if theme.UserID == nil || *theme.UserID != userID {
			return ListGeneratedPhotosResponse{}, errors.New("access denied to private theme")
		}
	}

	generated, err := h.app.GeneratedPhotoService.ListByTheme(c.Context(), themeID)
	if err != nil {
		return ListGeneratedPhotosResponse{}, err
	}

	return ListGeneratedPhotosResponse{GeneratedPhotos: generated}, nil
}

// UpdateStatusRequest is the request for updating generation status
type UpdateStatusRequest struct {
	Status       string  `json:"status" validate:"required,oneof=queued processing completed error"`
	ErrorMessage *string `json:"error_message,omitempty"`
}

// UpdateStatus updates the processing status
func (h *GeneratedPhotoHandler) UpdateStatus(c *fuego.ContextWithBody[UpdateStatusRequest]) (services.GeneratedPhoto, error) {
	// This endpoint is typically called by background workers
	// In production, you'd add additional authentication for workers
	
	id := c.PathParam("id")
	if id == "" {
		return services.GeneratedPhoto{}, errors.New("generated photo ID required")
	}

	req, err := c.Body()
	if err != nil {
		return services.GeneratedPhoto{}, err
	}

	input := services.UpdateGeneratedPhotoStatusInput{
		ID:           id,
		Status:       req.Status,
		ErrorMessage: req.ErrorMessage,
	}

	updated, err := h.app.GeneratedPhotoService.UpdateStatus(c.Context(), input)
	if err != nil {
		return services.GeneratedPhoto{}, err
	}

	return *updated, nil
}
