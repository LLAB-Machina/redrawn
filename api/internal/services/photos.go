package services

import (
	"context"
	"database/sql"
	"errors"
	"time"

	"github.com/google/uuid"
)

// Photo represents an uploaded photo
type Photo struct {
	ID          string    `json:"id"`
	AlbumID     string    `json:"album_id"`
	UserID      string    `json:"user_id"`
	StorageKey  string    `json:"storage_key"`
	Filename    *string   `json:"filename,omitempty"`
	MimeType    *string   `json:"mime_type,omitempty"`
	SizeBytes   *int64    `json:"size_bytes,omitempty"`
	Width       *int      `json:"width,omitempty"`
	Height      *int      `json:"height,omitempty"`
	Status      string    `json:"status"`
	CreatedAt   time.Time `json:"created_at"`
}

// CreatePhotoInput holds data for creating a photo
type CreatePhotoInput struct {
	AlbumID    string  `json:"album_id" validate:"required"`
	UserID     string  `json:"user_id" validate:"required"`
	StorageKey string  `json:"storage_key" validate:"required"`
	Filename   *string `json:"filename,omitempty"`
	MimeType   *string `json:"mime_type,omitempty"`
	SizeBytes  *int64  `json:"size_bytes,omitempty"`
	Width      *int    `json:"width,omitempty"`
	Height     *int    `json:"height,omitempty"`
}

// UpdatePhotoInput holds data for updating a photo
type UpdatePhotoInput struct {
	ID        string  `json:"id" validate:"required"`
	Filename  *string `json:"filename,omitempty"`
	Status    *string `json:"status,omitempty"`
	Width     *int    `json:"width,omitempty"`
	Height    *int    `json:"height,omitempty"`
}

// PhotoService handles photo business logic
type PhotoService struct {
	db *sql.DB
}

// NewPhotoService creates a new PhotoService
func NewPhotoService(db *sql.DB) *PhotoService {
	return &PhotoService{db: db}
}

// Create creates a new photo record
func (s *PhotoService) Create(ctx context.Context, input CreatePhotoInput) (*Photo, error) {
	photo := &Photo{
		ID:         uuid.New().String(),
		AlbumID:    input.AlbumID,
		UserID:     input.UserID,
		StorageKey: input.StorageKey,
		Filename:   input.Filename,
		MimeType:   input.MimeType,
		SizeBytes:  input.SizeBytes,
		Width:      input.Width,
		Height:     input.Height,
		Status:     "uploaded",
		CreatedAt:  time.Now(),
	}

	_, err := s.db.ExecContext(ctx,
		`INSERT INTO photos (id, album_id, user_id, storage_key, filename, mime_type, size_bytes, width, height, status, created_at)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
		photo.ID, photo.AlbumID, photo.UserID, photo.StorageKey, photo.Filename,
		photo.MimeType, photo.SizeBytes, photo.Width, photo.Height, photo.Status, photo.CreatedAt,
	)
	if err != nil {
		return nil, err
	}

	return photo, nil
}

// GetByID retrieves a photo by ID
func (s *PhotoService) GetByID(ctx context.Context, id string) (*Photo, error) {
	photo := &Photo{}
	var filename, mimeType sql.NullString
	var sizeBytes sql.NullInt64
	var width, height sql.NullInt32

	err := s.db.QueryRowContext(ctx,
		`SELECT id, album_id, user_id, storage_key, filename, mime_type, size_bytes, width, height, status, created_at
		 FROM photos WHERE id = $1`,
		id,
	).Scan(
		&photo.ID, &photo.AlbumID, &photo.UserID, &photo.StorageKey,
		&filename, &mimeType, &sizeBytes, &width, &height, &photo.Status, &photo.CreatedAt,
	)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, errors.New("photo not found")
		}
		return nil, err
	}

	if filename.Valid {
		photo.Filename = &filename.String
	}
	if mimeType.Valid {
		photo.MimeType = &mimeType.String
	}
	if sizeBytes.Valid {
		photo.SizeBytes = &sizeBytes.Int64
	}
	if width.Valid {
		w := int(width.Int32)
		photo.Width = &w
	}
	if height.Valid {
		h := int(height.Int32)
		photo.Height = &h
	}

	return photo, nil
}

// ListByAlbum lists all photos in an album
func (s *PhotoService) ListByAlbum(ctx context.Context, albumID string) ([]Photo, error) {
	rows, err := s.db.QueryContext(ctx,
		`SELECT id, album_id, user_id, storage_key, filename, mime_type, size_bytes, width, height, status, created_at
		 FROM photos WHERE album_id = $1 ORDER BY created_at DESC`,
		albumID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var photos []Photo
	for rows.Next() {
		var photo Photo
		var filename, mimeType sql.NullString
		var sizeBytes sql.NullInt64
		var width, height sql.NullInt32

		err := rows.Scan(
			&photo.ID, &photo.AlbumID, &photo.UserID, &photo.StorageKey,
			&filename, &mimeType, &sizeBytes, &width, &height, &photo.Status, &photo.CreatedAt,
		)
		if err != nil {
			return nil, err
		}

		if filename.Valid {
			photo.Filename = &filename.String
		}
		if mimeType.Valid {
			photo.MimeType = &mimeType.String
		}
		if sizeBytes.Valid {
			photo.SizeBytes = &sizeBytes.Int64
		}
		if width.Valid {
			w := int(width.Int32)
			photo.Width = &w
		}
		if height.Valid {
			h := int(height.Int32)
			photo.Height = &h
		}

		photos = append(photos, photo)
	}

	return photos, rows.Err()
}

// ListByUser lists all photos uploaded by a user
func (s *PhotoService) ListByUser(ctx context.Context, userID string) ([]Photo, error) {
	rows, err := s.db.QueryContext(ctx,
		`SELECT id, album_id, user_id, storage_key, filename, mime_type, size_bytes, width, height, status, created_at
		 FROM photos WHERE user_id = $1 ORDER BY created_at DESC`,
		userID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var photos []Photo
	for rows.Next() {
		var photo Photo
		var filename, mimeType sql.NullString
		var sizeBytes sql.NullInt64
		var width, height sql.NullInt32

		err := rows.Scan(
			&photo.ID, &photo.AlbumID, &photo.UserID, &photo.StorageKey,
			&filename, &mimeType, &sizeBytes, &width, &height, &photo.Status, &photo.CreatedAt,
		)
		if err != nil {
			return nil, err
		}

		if filename.Valid {
			photo.Filename = &filename.String
		}
		if mimeType.Valid {
			photo.MimeType = &mimeType.String
		}
		if sizeBytes.Valid {
			photo.SizeBytes = &sizeBytes.Int64
		}
		if width.Valid {
			w := int(width.Int32)
			photo.Width = &w
		}
		if height.Valid {
			h := int(height.Int32)
			photo.Height = &h
		}

		photos = append(photos, photo)
	}

	return photos, rows.Err()
}

// Update updates a photo
func (s *PhotoService) Update(ctx context.Context, input UpdatePhotoInput) (*Photo, error) {
	// Get current photo
	current, err := s.GetByID(ctx, input.ID)
	if err != nil {
		return nil, err
	}

	filename := current.Filename
	if input.Filename != nil {
		filename = input.Filename
	}
	status := current.Status
	if input.Status != nil {
		status = *input.Status
	}
	width := current.Width
	if input.Width != nil {
		width = input.Width
	}
	height := current.Height
	if input.Height != nil {
		height = input.Height
	}

	_, err = s.db.ExecContext(ctx,
		`UPDATE photos SET filename = $1, status = $2, width = $3, height = $4 WHERE id = $5`,
		filename, status, width, height, current.ID,
	)
	if err != nil {
		return nil, err
	}

	return s.GetByID(ctx, current.ID)
}

// Delete deletes a photo
func (s *PhotoService) Delete(ctx context.Context, id string) error {
	_, err := s.db.ExecContext(ctx, `DELETE FROM photos WHERE id = $1`, id)
	return err
}

// UpdateStatus updates just the status of a photo
func (s *PhotoService) UpdateStatus(ctx context.Context, id, status string) error {
	validStatuses := map[string]bool{"uploaded": true, "processing": true, "ready": true, "error": true}
	if !validStatuses[status] {
		return errors.New("invalid status")
	}

	_, err := s.db.ExecContext(ctx,
		`UPDATE photos SET status = $1 WHERE id = $2`,
		status, id,
	)
	return err
}

// CountByAlbum counts photos in an album
func (s *PhotoService) CountByAlbum(ctx context.Context, albumID string) (int, error) {
	var count int
	err := s.db.QueryRowContext(ctx,
		`SELECT COUNT(*) FROM photos WHERE album_id = $1`,
		albumID,
	).Scan(&count)
	return count, err
}
