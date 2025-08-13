package api

import "time"

// Generic responses
type OkResponse struct {
	Ok string `json:"ok"`
}

type StatusResponse struct {
	Status string `json:"status"`
}

type URLResponse struct {
	URL string `json:"url"`
}

type IDResponse struct {
	ID string `json:"id"`
}

// Domain models exposed by the API
type User struct {
	ID      string `json:"id"`
	Email   string `json:"email"`
	Name    string `json:"name,omitempty"`
	Handle  string `json:"handle"`
	Plan    string `json:"plan"`
	Credits int64  `json:"credits"`
}

type Album struct {
	ID         string `json:"id"`
	Name       string `json:"name"`
	Slug       string `json:"slug"`
	Visibility string `json:"visibility,omitempty"`
}

type Theme struct {
	ID        string         `json:"id"`
	Name      string         `json:"name"`
	Slug      string         `json:"slug"`
	Prompt    string         `json:"prompt,omitempty"`
	CSSTokens map[string]any `json:"css_tokens,omitempty"`
}

type OriginalPhoto struct {
	ID        string    `json:"id"`
	CreatedAt time.Time `json:"created_at"`
	FileID    string    `json:"file_id,omitempty"`
}

type GeneratedPhoto struct {
	ID      string `json:"id"`
	State   string `json:"state"`
	Error   string `json:"error,omitempty"`
	FileID  string `json:"file_id,omitempty"`
	ThemeID string `json:"theme_id,omitempty"`
}

type UploadInitResponse struct {
	UploadURL string `json:"upload_url"`
	FileID    string `json:"file_id"`
}

type TaskResponse struct {
	TaskID string `json:"task_id"`
}

type TaskStatusResponse struct {
	Status string `json:"status"`
}

// Public models
type PublicPhoto struct {
	ID     string `json:"id"`
	FileID string `json:"file_id,omitempty"`
}

type PublicAlbum struct {
	ID     string        `json:"id"`
	Slug   string        `json:"slug"`
	Name   string        `json:"name"`
	Photos []PublicPhoto `json:"photos"`
}

// Requests
type PatchMeRequest struct {
	Name   *string `json:"name"`
	Handle *string `json:"handle"`
}

type AlbumCreateRequest struct {
	Name       string `json:"name" validate:"required"`
	Slug       string `json:"slug" validate:"required"`
	Visibility string `json:"visibility"`
}

type AlbumUpdateRequest struct {
	Name       *string `json:"name"`
	Slug       *string `json:"slug"`
	Visibility *string `json:"visibility"`
}

type UploadInitRequest struct {
	Name string `json:"name"`
	Mime string `json:"mime"`
	Size int64  `json:"size"`
}

type CreateOriginalRequest struct {
	FileID string `json:"file_id"`
}

type GenerateRequest struct {
	ThemeID string `json:"theme_id"`
}

type CreateThemeRequest struct {
	Name      string         `json:"name"`
	Prompt    string         `json:"prompt"`
	CSSTokens map[string]any `json:"css_tokens"`
}

type InviteRequest struct {
	Email string `json:"email"`
	Role  string `json:"role"`
}

type RoleRequest struct {
	Role string `json:"role"`
}

type MagicLinkRequest struct {
	Email string `json:"email" validate:"required,email"`
}

type VerifyRequest struct {
	Token string `json:"token" validate:"required"`
}
