package handlers

import (
	"errors"

	"github.com/go-fuego/fuego"
	"redrawn/internal/app"
	"redrawn/internal/middleware"
	"redrawn/internal/services"
)

// StorageHandler handles file storage routes
type StorageHandler struct {
	app *app.App
}

// NewStorageHandler creates a new StorageHandler
func NewStorageHandler(a *app.App) *StorageHandler {
	return &StorageHandler{app: a}
}

// RegisterRoutes registers storage routes
func (h *StorageHandler) RegisterRoutes(s *fuego.Server) {
	// Presigned upload URL
	fuego.Post(s, "/storage/upload-url", h.GetUploadURL,
		fuego.OptionTags("Storage"),
		fuego.OptionOperationID("getUploadURL"),
		fuego.OptionDescription("Get a presigned URL for direct file upload"),
	)

	// Presigned download URL
	fuego.Post(s, "/storage/download-url", h.GetDownloadURL,
		fuego.OptionTags("Storage"),
		fuego.OptionOperationID("getDownloadURL"),
		fuego.OptionDescription("Get a presigned URL for downloading a file"),
	)

	// Delete file
	fuego.Delete(s, "/storage/{storageKey}", h.Delete,
		fuego.OptionTags("Storage"),
		fuego.OptionOperationID("deleteFile"),
		fuego.OptionDescription("Delete a file from storage"),
	)
}

// GetUploadURLRequest is the request for getting an upload URL
type GetUploadURLRequest struct {
	Filename string `json:"filename" validate:"required"`
	MimeType string `json:"mime_type" validate:"required"`
	Size     int64  `json:"size" validate:"required,min=1,max=104857600"` // Max 100MB
}

// GetUploadURLResponse is the response for getting an upload URL
type GetUploadURLResponse struct {
	UploadURL  string `json:"upload_url"`
	StorageKey string `json:"storage_key"`
	ExpiresAt  int64  `json:"expires_at"` // Unix timestamp
}

// GetUploadURL generates a presigned URL for uploading a file
func (h *StorageHandler) GetUploadURL(c *fuego.ContextWithBody[GetUploadURLRequest]) (GetUploadURLResponse, error) {
	userID := middleware.GetUserIDFromContext(c.Context())
	if userID == "" {
		return GetUploadURLResponse{}, errors.New("unauthorized")
	}

	req, err := c.Body()
	if err != nil {
		return GetUploadURLResponse{}, err
	}

	uploadReq := services.UploadURLRequest{
		Filename: req.Filename,
		MimeType: req.MimeType,
		Size:     req.Size,
	}

	result, err := h.app.StorageService.GenerateUploadURL(c.Context(), uploadReq)
	if err != nil {
		return GetUploadURLResponse{}, err
	}

	return GetUploadURLResponse{
		UploadURL:  result.UploadURL,
		StorageKey: result.StorageKey,
		ExpiresAt:  result.ExpiresAt,
	}, nil
}

// GetDownloadURLRequest is the request for getting a download URL
type GetDownloadURLRequest struct {
	StorageKey string `json:"storage_key" validate:"required"`
}

// GetDownloadURLResponse is the response for getting a download URL
type GetDownloadURLResponse struct {
	DownloadURL string `json:"download_url"`
	ExpiresAt   int64  `json:"expires_at"` // Unix timestamp
}

// GetDownloadURL generates a presigned URL for downloading a file
func (h *StorageHandler) GetDownloadURL(c *fuego.ContextWithBody[GetDownloadURLRequest]) (GetDownloadURLResponse, error) {
	userID := middleware.GetUserIDFromContext(c.Context())
	if userID == "" {
		return GetDownloadURLResponse{}, errors.New("unauthorized")
	}

	req, err := c.Body()
	if err != nil {
		return GetDownloadURLResponse{}, err
	}

	result, err := h.app.StorageService.GenerateDownloadURL(c.Context(), req.StorageKey)
	if err != nil {
		return GetDownloadURLResponse{}, err
	}

	return GetDownloadURLResponse{
		DownloadURL: result.DownloadURL,
		ExpiresAt:   result.ExpiresAt,
	}, nil
}

// DeleteFileResponse is the response for deleting a file
type DeleteFileResponse struct {
	Status string `json:"status"`
}

// Delete deletes a file from storage
func (h *StorageHandler) Delete(c *fuego.ContextNoBody) (DeleteFileResponse, error) {
	userID := middleware.GetUserIDFromContext(c.Context())
	if userID == "" {
		return DeleteFileResponse{}, errors.New("unauthorized")
	}

	storageKey := c.PathParam("storageKey")
	if storageKey == "" {
		return DeleteFileResponse{}, errors.New("storage key required")
	}

	// TODO: Check if user owns the photo with this storage key
	// For now, we allow deletion (the photo record will still exist in DB)

	if err := h.app.StorageService.DeleteObject(c.Context(), storageKey); err != nil {
		return DeleteFileResponse{}, err
	}

	return DeleteFileResponse{Status: "deleted"}, nil
}
