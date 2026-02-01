package handlers

import (
	"context"
	"errors"

	"github.com/go-fuego/fuego"
	"redrawn/internal/app"
	"redrawn/internal/middleware"
	"redrawn/internal/services"
)

// PhotoHandler handles photo routes
type PhotoHandler struct {
	app *app.App
}

// NewPhotoHandler creates a new PhotoHandler
func NewPhotoHandler(a *app.App) *PhotoHandler {
	return &PhotoHandler{app: a}
}

// RegisterRoutes registers photo routes
func (h *PhotoHandler) RegisterRoutes(s *fuego.Server) {
	// Photo CRUD
	fuego.Get(s, "/photos", h.List,
		fuego.OptionTags("Photos"),
		fuego.OptionOperationID("listPhotos"),
		fuego.OptionDescription("List all photos for the current user"),
	)
	fuego.Post(s, "/photos", h.Create,
		fuego.OptionTags("Photos"),
		fuego.OptionOperationID("createPhoto"),
		fuego.OptionDescription("Create a new photo record (after upload)"),
	)
	fuego.Get(s, "/photos/{id}", h.Get,
		fuego.OptionTags("Photos"),
		fuego.OptionOperationID("getPhoto"),
		fuego.OptionDescription("Get a photo by ID"),
	)
	fuego.Put(s, "/photos/{id}", h.Update,
		fuego.OptionTags("Photos"),
		fuego.OptionOperationID("updatePhoto"),
		fuego.OptionDescription("Update photo metadata"),
	)
	fuego.Delete(s, "/photos/{id}", h.Delete,
		fuego.OptionTags("Photos"),
		fuego.OptionOperationID("deletePhoto"),
		fuego.OptionDescription("Delete a photo"),
	)

	// Album-specific photo routes
	fuego.Get(s, "/albums/{albumID}/photos", h.ListByAlbum,
		fuego.OptionTags("Photos"),
		fuego.OptionOperationID("listAlbumPhotos"),
		fuego.OptionDescription("List all photos in an album"),
	)

	// Photo status management
	fuego.Post(s, "/photos/{id}/status", h.UpdateStatus,
		fuego.OptionTags("Photos"),
		fuego.OptionOperationID("updatePhotoStatus"),
		fuego.OptionDescription("Update photo processing status"),
	)
}

// ListPhotosResponse is the response for listing photos
type ListPhotosResponse struct {
	Photos []services.Photo `json:"photos"`
}

// List lists all photos for the current user
func (h *PhotoHandler) List(c *fuego.ContextNoBody) (ListPhotosResponse, error) {
	userID := getUserIDFromContext(c.Context())
	if userID == "" {
		return ListPhotosResponse{}, errors.New("unauthorized")
	}

	photos, err := h.app.PhotoService.ListByUser(c.Context(), userID)
	if err != nil {
		return ListPhotosResponse{}, err
	}

	return ListPhotosResponse{Photos: photos}, nil
}

// CreatePhotoRequest is the request for creating a photo
type CreatePhotoRequest struct {
	AlbumID    string  `json:"album_id" validate:"required"`
	StorageKey string  `json:"storage_key" validate:"required"`
	Filename   *string `json:"filename,omitempty"`
	MimeType   *string `json:"mime_type,omitempty"`
	SizeBytes  *int64  `json:"size_bytes,omitempty"`
	Width      *int    `json:"width,omitempty"`
	Height     *int    `json:"height,omitempty"`
}

// Create creates a new photo record
func (h *PhotoHandler) Create(c *fuego.ContextWithBody[CreatePhotoRequest]) (services.Photo, error) {
	userID := getUserIDFromContext(c.Context())
	if userID == "" {
		return services.Photo{}, errors.New("unauthorized")
	}

	req, err := c.Body()
	if err != nil {
		return services.Photo{}, err
	}

	// Check user has access to album
	role, err := h.app.AlbumService.GetUserRole(c.Context(), req.AlbumID, userID)
	if err != nil {
		return services.Photo{}, errors.New("access denied to album")
	}
	if role != "owner" && role != "admin" && role != "editor" {
		return services.Photo{}, errors.New("insufficient permissions")
	}

	input := services.CreatePhotoInput{
		AlbumID:    req.AlbumID,
		UserID:     userID,
		StorageKey: req.StorageKey,
		Filename:   req.Filename,
		MimeType:   req.MimeType,
		SizeBytes:  req.SizeBytes,
		Width:      req.Width,
		Height:     req.Height,
	}

	return h.app.PhotoService.Create(c.Context(), input)
}

// Get gets a photo by ID
func (h *PhotoHandler) Get(c *fuego.ContextNoBody) (services.Photo, error) {
	userID := getUserIDFromContext(c.Context())
	if userID == "" {
		return services.Photo{}, errors.New("unauthorized")
	}

	id := c.PathParam("id")

	photo, err := h.app.PhotoService.GetByID(c.Context(), id)
	if err != nil {
		return services.Photo{}, err
	}

	// Check access - must be album member or photo owner
	role, err := h.app.AlbumService.GetUserRole(c.Context(), photo.AlbumID, userID)
	if err != nil && photo.UserID != userID {
		return services.Photo{}, errors.New("access denied")
	}
	_ = role // role checked implicitly by GetUserRole success

	return *photo, nil
}

// UpdatePhotoRequest is the request for updating a photo
type UpdatePhotoRequest struct {
	Filename *string `json:"filename,omitempty"`
	Width    *int    `json:"width,omitempty"`
	Height   *int    `json:"height,omitempty"`
}

// Update updates a photo
func (h *PhotoHandler) Update(c *fuego.ContextWithBody[UpdatePhotoRequest]) (services.Photo, error) {
	userID := getUserIDFromContext(c.Context())
	if userID == "" {
		return services.Photo{}, errors.New("unauthorized")
	}

	id := c.PathParam("id")

	// Get current photo
	photo, err := h.app.PhotoService.GetByID(c.Context(), id)
	if err != nil {
		return services.Photo{}, err
	}

	// Check permissions - must be photo owner or album admin/owner
	role, _ := h.app.AlbumService.GetUserRole(c.Context(), photo.AlbumID, userID)
	if photo.UserID != userID && role != "owner" && role != "admin" {
		return services.Photo{}, errors.New("insufficient permissions")
	}

	req, err := c.Body()
	if err != nil {
		return services.Photo{}, err
	}

	input := services.UpdatePhotoInput{
		ID:       id,
		Filename: req.Filename,
		Width:    req.Width,
		Height:   req.Height,
	}

	return h.app.PhotoService.Update(c.Context(), input)
}

// Delete deletes a photo
func (h *PhotoHandler) Delete(c *fuego.ContextNoBody) (any, error) {
	userID := getUserIDFromContext(c.Context())
	if userID == "" {
		return nil, errors.New("unauthorized")
	}

	id := c.PathParam("id")

	// Get current photo
	photo, err := h.app.PhotoService.GetByID(c.Context(), id)
	if err != nil {
		return nil, err
	}

	// Check permissions - must be photo owner or album admin/owner
	role, _ := h.app.AlbumService.GetUserRole(c.Context(), photo.AlbumID, userID)
	if photo.UserID != userID && role != "owner" && role != "admin" {
		return nil, errors.New("insufficient permissions")
	}

	if err := h.app.PhotoService.Delete(c.Context(), id); err != nil {
		return nil, err
	}

	return map[string]string{"status": "deleted"}, nil
}

// ListByAlbum lists photos in an album
func (h *PhotoHandler) ListByAlbum(c *fuego.ContextNoBody) (ListPhotosResponse, error) {
	userID := getUserIDFromContext(c.Context())
	if userID == "" {
		return ListPhotosResponse{}, errors.New("unauthorized")
	}

	albumID := c.PathParam("albumID")

	// Check user has access to album
	_, err := h.app.AlbumService.GetUserRole(c.Context(), albumID, userID)
	if err != nil {
		// Check if album is public
		album, err := h.app.AlbumService.GetByID(c.Context(), albumID)
		if err != nil || !album.IsPublic {
			return ListPhotosResponse{}, errors.New("access denied to album")
		}
	}

	photos, err := h.app.PhotoService.ListByAlbum(c.Context(), albumID)
	if err != nil {
		return ListPhotosResponse{}, err
	}

	return ListPhotosResponse{Photos: photos}, nil
}

// UpdatePhotoStatusRequest is the request for updating photo status
type UpdatePhotoStatusRequest struct {
	Status string `json:"status" validate:"required,oneof=uploaded processing ready error"`
}

// UpdateStatus updates photo processing status
func (h *PhotoHandler) UpdateStatus(c *fuego.ContextWithBody[UpdatePhotoStatusRequest]) (services.Photo, error) {
	userID := getUserIDFromContext(c.Context())
	if userID == "" {
		return services.Photo{}, errors.New("unauthorized")
	}

	id := c.PathParam("id")

	// Get current photo
	photo, err := h.app.PhotoService.GetByID(c.Context(), id)
	if err != nil {
		return services.Photo{}, err
	}

	// Check permissions
	role, _ := h.app.AlbumService.GetUserRole(c.Context(), photo.AlbumID, userID)
	if photo.UserID != userID && role != "owner" && role != "admin" && role != "editor" {
		return services.Photo{}, errors.New("insufficient permissions")
	}

	req, err := c.Body()
	if err != nil {
		return services.Photo{}, err
	}

	if err := h.app.PhotoService.UpdateStatus(c.Context(), id, req.Status); err != nil {
		return services.Photo{}, err
	}

	return h.app.PhotoService.GetByID(c.Context(), id)
}
