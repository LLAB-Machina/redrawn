package handlers

import (
	"context"
	"errors"

	"github.com/go-fuego/fuego"
	"redrawn/internal/app"
	"redrawn/internal/middleware"
	"redrawn/internal/services"
)

// AlbumHandler handles album routes
type AlbumHandler struct {
	app *app.App
}

// NewAlbumHandler creates a new AlbumHandler
func NewAlbumHandler(a *app.App) *AlbumHandler {
	return &AlbumHandler{app: a}
}

// RegisterRoutes registers album routes
func (h *AlbumHandler) RegisterRoutes(s *fuego.Server) {
	// Album CRUD
	fuego.Get(s, "/albums", h.List,
		fuego.OptionTags("Albums"),
		fuego.OptionOperationID("listAlbums"),
		fuego.OptionDescription("List all albums for the current user"),
	)
	fuego.Post(s, "/albums", h.Create,
		fuego.OptionTags("Albums"),
		fuego.OptionOperationID("createAlbum"),
		fuego.OptionDescription("Create a new album"),
	)
	fuego.Get(s, "/albums/{id}", h.Get,
		fuego.OptionTags("Albums"),
		fuego.OptionOperationID("getAlbum"),
		fuego.OptionDescription("Get an album by ID"),
	)
	fuego.Put(s, "/albums/{id}", h.Update,
		fuego.OptionTags("Albums"),
		fuego.OptionOperationID("updateAlbum"),
		fuego.OptionDescription("Update an album"),
	)
	fuego.Delete(s, "/albums/{id}", h.Delete,
		fuego.OptionTags("Albums"),
		fuego.OptionOperationID("deleteAlbum"),
		fuego.OptionDescription("Delete an album"),
	)

	// Album actions
	fuego.Post(s, "/albums/{id}/confirm", h.Confirm,
		fuego.OptionTags("Albums"),
		fuego.OptionOperationID("confirmAlbum"),
		fuego.OptionDescription("Confirm a staged album"),
	)

	// Public album access
	fuego.Get(s, "/public/albums/{slug}", h.GetBySlug,
		fuego.OptionTags("Public"),
		fuego.OptionOperationID("getPublicAlbum"),
		fuego.OptionDescription("Get a public album by slug"),
	)

	// Album members
	fuego.Get(s, "/albums/{id}/members", h.ListMembers,
		fuego.OptionTags("Albums"),
		fuego.OptionOperationID("listAlbumMembers"),
		fuego.OptionDescription("List album members"),
	)
	fuego.Post(s, "/albums/{id}/members", h.AddMember,
		fuego.OptionTags("Albums"),
		fuego.OptionOperationID("addAlbumMember"),
		fuego.OptionDescription("Add a member to an album"),
	)
	fuego.Delete(s, "/albums/{id}/members/{userID}", h.RemoveMember,
		fuego.OptionTags("Albums"),
		fuego.OptionOperationID("removeAlbumMember"),
		fuego.OptionDescription("Remove a member from an album"),
	)
}

// ListAlbumsResponse is the response for listing albums
type ListAlbumsResponse struct {
	Albums []services.Album `json:"albums"`
}

// List lists all albums for the current user
func (h *AlbumHandler) List(c *fuego.ContextNoBody) (ListAlbumsResponse, error) {
	userID := getUserIDFromContext(c.Context())
	if userID == "" {
		return ListAlbumsResponse{}, errors.New("unauthorized")
	}

	albums, err := h.app.AlbumService.ListByUser(c.Context(), userID)
	if err != nil {
		return ListAlbumsResponse{}, err
	}

	return ListAlbumsResponse{Albums: albums}, nil
}

// CreateAlbumRequest is the request for creating an album
type CreateAlbumRequest struct {
	Name        string  `json:"name" validate:"required"`
	Slug        *string `json:"slug,omitempty"`
	Description *string `json:"description,omitempty"`
	IsPublic    bool    `json:"is_public"`
}

// CreateAlbumResponse is the response for creating an album
type CreateAlbumResponse struct {
	Album services.Album `json:"album"`
}

// Create creates a new album
func (h *AlbumHandler) Create(c *fuego.ContextWithBody[CreateAlbumRequest]) (CreateAlbumResponse, error) {
	userID := getUserIDFromContext(c.Context())
	if userID == "" {
		return CreateAlbumResponse{}, errors.New("unauthorized")
	}

	input, err := c.Body()
	if err != nil {
		return CreateAlbumResponse{}, err
	}

	album, err := h.app.AlbumService.Create(c.Context(), services.CreateAlbumInput{
		UserID:      userID,
		Name:        input.Name,
		Slug:        input.Slug,
		Description: input.Description,
		IsPublic:    input.IsPublic,
	})
	if err != nil {
		return CreateAlbumResponse{}, err
	}

	return CreateAlbumResponse{Album: *album}, nil
}

// GetAlbumResponse is the response for getting an album
type GetAlbumResponse struct {
	Album services.Album `json:"album"`
}

// Get gets an album by ID
func (h *AlbumHandler) Get(c *fuego.ContextNoBody) (GetAlbumResponse, error) {
	userID := getUserIDFromContext(c.Context())
	if userID == "" {
		return GetAlbumResponse{}, errors.New("unauthorized")
	}

	id := c.PathParam("id")
	album, err := h.app.AlbumService.GetByID(c.Context(), id)
	if err != nil {
		return GetAlbumResponse{}, err
	}

	// Check if user has access
	_, err = h.app.AlbumService.GetUserRole(c.Context(), id, userID)
	if err != nil && album.UserID != userID {
		return GetAlbumResponse{}, errors.New("access denied")
	}

	return GetAlbumResponse{Album: *album}, nil
}

// UpdateAlbumRequest is the request for updating an album
type UpdateAlbumRequest struct {
	Name        *string `json:"name,omitempty"`
	Slug        *string `json:"slug,omitempty"`
	Description *string `json:"description,omitempty"`
	IsPublic    *bool   `json:"is_public,omitempty"`
}

// UpdateAlbumResponse is the response for updating an album
type UpdateAlbumResponse struct {
	Album services.Album `json:"album"`
}

// Update updates an album
func (h *AlbumHandler) Update(c *fuego.ContextWithBody[UpdateAlbumRequest]) (UpdateAlbumResponse, error) {
	userID := getUserIDFromContext(c.Context())
	if userID == "" {
		return UpdateAlbumResponse{}, errors.New("unauthorized")
	}

	id := c.PathParam("id")

	// Check if user has permission (owner or admin)
	role, err := h.app.AlbumService.GetUserRole(c.Context(), id, userID)
	if err != nil {
		return UpdateAlbumResponse{}, err
	}
	if role != "owner" && role != "admin" {
		return UpdateAlbumResponse{}, errors.New("insufficient permissions")
	}

	input, err := c.Body()
	if err != nil {
		return UpdateAlbumResponse{}, err
	}

	album, err := h.app.AlbumService.Update(c.Context(), services.UpdateAlbumInput{
		ID:          id,
		Name:        input.Name,
		Slug:        input.Slug,
		Description: input.Description,
		IsPublic:    input.IsPublic,
	})
	if err != nil {
		return UpdateAlbumResponse{}, err
	}

	return UpdateAlbumResponse{Album: *album}, nil
}

// Delete deletes an album
func (h *AlbumHandler) Delete(c *fuego.ContextNoBody) (any, error) {
	userID := getUserIDFromContext(c.Context())
	if userID == "" {
		return nil, errors.New("unauthorized")
	}

	id := c.PathParam("id")

	// Check if user is owner
	role, err := h.app.AlbumService.GetUserRole(c.Context(), id, userID)
	if err != nil {
		return nil, err
	}
	if role != "owner" {
		return nil, errors.New("only owner can delete album")
	}

	if err := h.app.AlbumService.Delete(c.Context(), id); err != nil {
		return nil, err
	}

	return map[string]string{"status": "deleted"}, nil
}

// ConfirmResponse is the response for confirming an album
type ConfirmResponse struct {
	Album services.Album `json:"album"`
}

// Confirm confirms a staged album
func (h *AlbumHandler) Confirm(c *fuego.ContextNoBody) (ConfirmResponse, error) {
	userID := getUserIDFromContext(c.Context())
	if userID == "" {
		return ConfirmResponse{}, errors.New("unauthorized")
	}

	id := c.PathParam("id")

	// Check if user has permission
	role, err := h.app.AlbumService.GetUserRole(c.Context(), id, userID)
	if err != nil {
		return ConfirmResponse{}, err
	}
	if role != "owner" && role != "admin" {
		return ConfirmResponse{}, errors.New("insufficient permissions")
	}

	album, err := h.app.AlbumService.Confirm(c.Context(), id)
	if err != nil {
		return ConfirmResponse{}, err
	}

	return ConfirmResponse{Album: *album}, nil
}

// GetBySlug gets a public album by slug
func (h *AlbumHandler) GetBySlug(c *fuego.ContextNoBody) (GetAlbumResponse, error) {
	slug := c.PathParam("slug")
	album, err := h.app.AlbumService.GetBySlug(c.Context(), slug)
	if err != nil {
		return GetAlbumResponse{}, err
	}

	return GetAlbumResponse{Album: *album}, nil
}

// ListMembersResponse is the response for listing members
type ListMembersResponse struct {
	Members []services.AlbumMember `json:"members"`
}

// ListMembers lists all members of an album
func (h *AlbumHandler) ListMembers(c *fuego.ContextNoBody) (ListMembersResponse, error) {
	userID := getUserIDFromContext(c.Context())
	if userID == "" {
		return ListMembersResponse{}, errors.New("unauthorized")
	}

	id := c.PathParam("id")

	// Check if user has access
	_, err := h.app.AlbumService.GetUserRole(c.Context(), id, userID)
	if err != nil {
		return ListMembersResponse{}, err
	}

	members, err := h.app.AlbumService.ListMembers(c.Context(), id)
	if err != nil {
		return ListMembersResponse{}, err
	}

	return ListMembersResponse{Members: members}, nil
}

// AddMemberRequest is the request for adding a member
type AddMemberRequest struct {
	UserID string `json:"user_id" validate:"required"`
	Role   string `json:"role" validate:"required,oneof=admin editor viewer"`
}

// AddMemberResponse is the response for adding a member
type AddMemberResponse struct {
	Member services.AlbumMember `json:"member"`
}

// AddMember adds a member to an album
func (h *AlbumHandler) AddMember(c *fuego.ContextWithBody[AddMemberRequest]) (AddMemberResponse, error) {
	userID := getUserIDFromContext(c.Context())
	if userID == "" {
		return AddMemberResponse{}, errors.New("unauthorized")
	}

	id := c.PathParam("id")

	// Check if user has permission
	role, err := h.app.AlbumService.GetUserRole(c.Context(), id, userID)
	if err != nil {
		return AddMemberResponse{}, err
	}
	if role != "owner" && role != "admin" {
		return AddMemberResponse{}, errors.New("insufficient permissions")
	}

	input, err := c.Body()
	if err != nil {
		return AddMemberResponse{}, err
	}

	member, err := h.app.AlbumService.AddMember(c.Context(), id, input.UserID, input.Role)
	if err != nil {
		return AddMemberResponse{}, err
	}

	return AddMemberResponse{Member: *member}, nil
}

// RemoveMember removes a member from an album
func (h *AlbumHandler) RemoveMember(c *fuego.ContextNoBody) (any, error) {
	userID := getUserIDFromContext(c.Context())
	if userID == "" {
		return nil, errors.New("unauthorized")
	}

	id := c.PathParam("id")
	memberUserID := c.PathParam("userID")

	// Check if user has permission
	role, err := h.app.AlbumService.GetUserRole(c.Context(), id, userID)
	if err != nil {
		return nil, err
	}
	if role != "owner" && role != "admin" {
		return nil, errors.New("insufficient permissions")
	}

	// Can't remove owner
	memberRole, err := h.app.AlbumService.GetUserRole(c.Context(), id, memberUserID)
	if err != nil {
		return nil, err
	}
	if memberRole == "owner" {
		return nil, errors.New("cannot remove owner")
	}

	if err := h.app.AlbumService.RemoveMember(c.Context(), id, memberUserID); err != nil {
		return nil, err
	}

	return map[string]string{"status": "removed"}, nil
}

// getUserIDFromContext extracts user ID from context
func getUserIDFromContext(ctx context.Context) string {
	return middleware.GetUserIDFromContext(ctx)
}
