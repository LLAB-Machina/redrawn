package services

import (
	"context"
	"database/sql"
	"errors"
	"time"

	"github.com/google/uuid"
)

// GeneratedPhoto represents a themed/generated variant of an original photo
type GeneratedPhoto struct {
	ID              string     `json:"id"`
	OriginalPhotoID string     `json:"original_photo_id"`
	ThemeID         string     `json:"theme_id"`
	StorageKey      string     `json:"storage_key"`
	Status          string     `json:"status"`
	CreditsUsed     int        `json:"credits_used"`
	ErrorMessage    *string    `json:"error_message,omitempty"`
	CreatedAt       time.Time  `json:"created_at"`
	CompletedAt     *time.Time `json:"completed_at,omitempty"`
}

// CreateGeneratedPhotoInput holds data for creating a generated photo
type CreateGeneratedPhotoInput struct {
	OriginalPhotoID string `json:"original_photo_id" validate:"required"`
	ThemeID         string `json:"theme_id" validate:"required"`
	StorageKey      string `json:"storage_key" validate:"required"`
	CreditsUsed     int    `json:"credits_used,omitempty"`
}

// UpdateGeneratedPhotoInput holds data for updating a generated photo
type UpdateGeneratedPhotoInput struct {
	ID           string  `json:"id" validate:"required"`
	StorageKey   *string `json:"storage_key,omitempty"`
	Status       *string `json:"status,omitempty"`
	CreditsUsed  *int    `json:"credits_used,omitempty"`
	ErrorMessage *string `json:"error_message,omitempty"`
}

// UpdateStatusInput holds data for updating status
type UpdateGeneratedPhotoStatusInput struct {
	ID           string  `json:"id" validate:"required"`
	Status       string  `json:"status" validate:"required,oneof=queued processing completed error"`
	ErrorMessage *string `json:"error_message,omitempty"`
}

// GeneratedPhotoService handles generated photo business logic
type GeneratedPhotoService struct {
	db *sql.DB
}

// NewGeneratedPhotoService creates a new GeneratedPhotoService
func NewGeneratedPhotoService(db *sql.DB) *GeneratedPhotoService {
	return &GeneratedPhotoService{db: db}
}

// Create creates a new generated photo record (queues for processing)
func (s *GeneratedPhotoService) Create(ctx context.Context, input CreateGeneratedPhotoInput) (*GeneratedPhoto, error) {
	generated := &GeneratedPhoto{
		ID:              uuid.New().String(),
		OriginalPhotoID: input.OriginalPhotoID,
		ThemeID:         input.ThemeID,
		StorageKey:      input.StorageKey,
		Status:          "queued",
		CreditsUsed:     input.CreditsUsed,
		CreatedAt:       time.Now(),
	}

	_, err := s.db.ExecContext(ctx,
		`INSERT INTO generated_photos (id, original_photo_id, theme_id, storage_key, status, credits_used, created_at)
		 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
		generated.ID, generated.OriginalPhotoID, generated.ThemeID, generated.StorageKey,
		generated.Status, generated.CreditsUsed, generated.CreatedAt,
	)
	if err != nil {
		return nil, err
	}

	return generated, nil
}

// GetByID retrieves a generated photo by ID
func (s *GeneratedPhotoService) GetByID(ctx context.Context, id string) (*GeneratedPhoto, error) {
	generated := &GeneratedPhoto{}
	var errorMessage sql.NullString
	var completedAt sql.NullTime

	err := s.db.QueryRowContext(ctx,
		`SELECT id, original_photo_id, theme_id, storage_key, status, credits_used, error_message, created_at, completed_at
		 FROM generated_photos WHERE id = $1`,
		id,
	).Scan(
		&generated.ID, &generated.OriginalPhotoID, &generated.ThemeID, &generated.StorageKey,
		&generated.Status, &generated.CreditsUsed, &errorMessage, &generated.CreatedAt, &completedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}

	if errorMessage.Valid {
		generated.ErrorMessage = &errorMessage.String
	}
	if completedAt.Valid {
		generated.CompletedAt = &completedAt.Time
	}

	return generated, nil
}

// ListByOriginalPhoto lists all generated variants for an original photo
func (s *GeneratedPhotoService) ListByOriginalPhoto(ctx context.Context, originalPhotoID string) ([]GeneratedPhoto, error) {
	rows, err := s.db.QueryContext(ctx,
		`SELECT id, original_photo_id, theme_id, storage_key, status, credits_used, error_message, created_at, completed_at
		 FROM generated_photos WHERE original_photo_id = $1 ORDER BY created_at DESC`,
		originalPhotoID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	return s.scanGeneratedPhotos(rows)
}

// ListByTheme lists all generated photos using a specific theme
func (s *GeneratedPhotoService) ListByTheme(ctx context.Context, themeID string) ([]GeneratedPhoto, error) {
	rows, err := s.db.QueryContext(ctx,
		`SELECT id, original_photo_id, theme_id, storage_key, status, credits_used, error_message, created_at, completed_at
		 FROM generated_photos WHERE theme_id = $1 ORDER BY created_at DESC`,
		themeID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	return s.scanGeneratedPhotos(rows)
}

// ListByUser lists all generated photos for photos owned by a user
func (s *GeneratedPhotoService) ListByUser(ctx context.Context, userID string) ([]GeneratedPhoto, error) {
	rows, err := s.db.QueryContext(ctx,
		`SELECT g.id, g.original_photo_id, g.theme_id, g.storage_key, g.status, g.credits_used, g.error_message, g.created_at, g.completed_at
		 FROM generated_photos g
		 JOIN photos p ON g.original_photo_id = p.id
		 WHERE p.user_id = $1
		 ORDER BY g.created_at DESC`,
		userID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	return s.scanGeneratedPhotos(rows)
}

// Update updates a generated photo's metadata
func (s *GeneratedPhotoService) Update(ctx context.Context, input UpdateGeneratedPhotoInput) (*GeneratedPhoto, error) {
	generated, err := s.GetByID(ctx, input.ID)
	if err != nil {
		return nil, err
	}
	if generated == nil {
		return nil, errors.New("generated photo not found")
	}

	if input.StorageKey != nil {
		generated.StorageKey = *input.StorageKey
	}
	if input.Status != nil {
		generated.Status = *input.Status
		if *input.Status == "completed" || *input.Status == "error" {
			now := time.Now()
			generated.CompletedAt = &now
		}
	}
	if input.CreditsUsed != nil {
		generated.CreditsUsed = *input.CreditsUsed
	}
	if input.ErrorMessage != nil {
		generated.ErrorMessage = input.ErrorMessage
	}

	var completedAt interface{}
	if generated.CompletedAt != nil {
		completedAt = *generated.CompletedAt
	} else {
		completedAt = nil
	}

	_, err = s.db.ExecContext(ctx,
		`UPDATE generated_photos 
		 SET storage_key = $2, status = $3, credits_used = $4, error_message = $5, completed_at = $6
		 WHERE id = $1`,
		generated.ID, generated.StorageKey, generated.Status, generated.CreditsUsed,
		generated.ErrorMessage, completedAt,
	)
	if err != nil {
		return nil, err
	}

	return generated, nil
}

// UpdateStatus updates the processing status of a generated photo
func (s *GeneratedPhotoService) UpdateStatus(ctx context.Context, input UpdateGeneratedPhotoStatusInput) (*GeneratedPhoto, error) {
	generated, err := s.GetByID(ctx, input.ID)
	if err != nil {
		return nil, err
	}
	if generated == nil {
		return nil, errors.New("generated photo not found")
	}

	generated.Status = input.Status
	if input.ErrorMessage != nil {
		generated.ErrorMessage = input.ErrorMessage
	}

	var completedAt interface{}
	if input.Status == "completed" || input.Status == "error" {
		now := time.Now()
		generated.CompletedAt = &now
		completedAt = now
	}

	_, err = s.db.ExecContext(ctx,
		`UPDATE generated_photos 
		 SET status = $2, error_message = $3, completed_at = $4
		 WHERE id = $1`,
		generated.ID, generated.Status, generated.ErrorMessage, completedAt,
	)
	if err != nil {
		return nil, err
	}

	return generated, nil
}

// Delete soft-deletes a generated photo
func (s *GeneratedPhotoService) Delete(ctx context.Context, id string) error {
	_, err := s.db.ExecContext(ctx,
		`DELETE FROM generated_photos WHERE id = $1`,
		id,
	)
	return err
}

// GetOriginalPhotoUserID gets the user ID of the original photo's uploader
func (s *GeneratedPhotoService) GetOriginalPhotoUserID(ctx context.Context, generatedPhotoID string) (string, error) {
	var userID string
	err := s.db.QueryRowContext(ctx,
		`SELECT p.user_id 
		 FROM generated_photos g
		 JOIN photos p ON g.original_photo_id = p.id
		 WHERE g.id = $1`,
		generatedPhotoID,
	).Scan(&userID)
	if err != nil {
		return "", err
	}
	return userID, nil
}

// Helper to scan generated photos from rows
func (s *GeneratedPhotoService) scanGeneratedPhotos(rows *sql.Rows) ([]GeneratedPhoto, error) {
	var generatedPhotos []GeneratedPhoto

	for rows.Next() {
		var g GeneratedPhoto
		var errorMessage sql.NullString
		var completedAt sql.NullTime

		err := rows.Scan(
			&g.ID, &g.OriginalPhotoID, &g.ThemeID, &g.StorageKey,
			&g.Status, &g.CreditsUsed, &errorMessage, &g.CreatedAt, &completedAt,
		)
		if err != nil {
			return nil, err
		}

		if errorMessage.Valid {
			g.ErrorMessage = &errorMessage.String
		}
		if completedAt.Valid {
			g.CompletedAt = &completedAt.Time
		}

		generatedPhotos = append(generatedPhotos, g)
	}

	return generatedPhotos, rows.Err()
}
