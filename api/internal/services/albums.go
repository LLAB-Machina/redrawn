package services

import (
	"context"
	"database/sql"
	"errors"
	"time"

	"github.com/google/uuid"
)

// Album represents a photo album
type Album struct {
	ID          string     `json:"id"`
	GroupID     string     `json:"group_id"`
	UserID      string     `json:"user_id"`
	Name        string     `json:"name"`
	Slug        *string    `json:"slug,omitempty"`
	Description *string    `json:"description,omitempty"`
	Status      string     `json:"status"`
	IsPublic    bool       `json:"is_public"`
	CreatedAt   time.Time  `json:"created_at"`
	ConfirmedAt *time.Time `json:"confirmed_at,omitempty"`
}

// AlbumMember represents a user's membership in an album
type AlbumMember struct {
	ID        string    `json:"id"`
	AlbumID   string    `json:"album_id"`
	UserID    string    `json:"user_id"`
	Role      string    `json:"role"`
	CreatedAt time.Time `json:"created_at"`
}

// CreateAlbumInput holds data for creating an album
type CreateAlbumInput struct {
	UserID      string  `json:"user_id" validate:"required"`
	Name        string  `json:"name" validate:"required"`
	Slug        *string `json:"slug,omitempty"`
	Description *string `json:"description,omitempty"`
	IsPublic    bool    `json:"is_public"`
}

// UpdateAlbumInput holds data for updating an album
type UpdateAlbumInput struct {
	ID          string  `json:"id" validate:"required"`
	Name        *string `json:"name,omitempty"`
	Slug        *string `json:"slug,omitempty"`
	Description *string `json:"description,omitempty"`
	IsPublic    *bool   `json:"is_public,omitempty"`
}

// AlbumService handles album business logic
type AlbumService struct {
	db *sql.DB
}

// NewAlbumService creates a new AlbumService
func NewAlbumService(db *sql.DB) *AlbumService {
	return &AlbumService{db: db}
}

// Create creates a new album with staging pattern
func (s *AlbumService) Create(ctx context.Context, input CreateAlbumInput) (*Album, error) {
	groupID := uuid.New().String()
	albumID := uuid.New().String()
	now := time.Now()

	album := &Album{
		ID:          albumID,
		GroupID:     groupID,
		UserID:      input.UserID,
		Name:        input.Name,
		Slug:        input.Slug,
		Description: input.Description,
		Status:      "staged",
		IsPublic:    input.IsPublic,
		CreatedAt:   now,
	}

	_, err := s.db.ExecContext(ctx,
		`INSERT INTO albums (id, group_id, user_id, name, slug, description, status, is_public, created_at)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
		album.ID, album.GroupID, album.UserID, album.Name, album.Slug, album.Description,
		album.Status, album.IsPublic, album.CreatedAt,
	)
	if err != nil {
		return nil, err
	}

	// Add creator as owner
	_, err = s.db.ExecContext(ctx,
		`INSERT INTO album_users (id, album_id, user_id, role, created_at)
		 VALUES ($1, $2, $3, $4, $5)`,
		uuid.New().String(), album.ID, input.UserID, "owner", now,
	)
	if err != nil {
		return nil, err
	}

	return album, nil
}

// GetByID retrieves an album by ID
func (s *AlbumService) GetByID(ctx context.Context, id string) (*Album, error) {
	album := &Album{}
	var confirmedAt sql.NullTime
	var slug, description sql.NullString

	err := s.db.QueryRowContext(ctx,
		`SELECT id, group_id, user_id, name, slug, description, status, is_public, created_at, confirmed_at
		 FROM albums WHERE id = $1 AND status != 'deleted'`,
		id,
	).Scan(
		&album.ID, &album.GroupID, &album.UserID, &album.Name,
		&slug, &description, &album.Status, &album.IsPublic,
		&album.CreatedAt, &confirmedAt,
	)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, errors.New("album not found")
		}
		return nil, err
	}

	if slug.Valid {
		album.Slug = &slug.String
	}
	if description.Valid {
		album.Description = &description.String
	}
	if confirmedAt.Valid {
		album.ConfirmedAt = &confirmedAt.Time
	}

	return album, nil
}

// GetBySlug retrieves a public album by slug
func (s *AlbumService) GetBySlug(ctx context.Context, slug string) (*Album, error) {
	album := &Album{}
	var confirmedAt sql.NullTime
	var description sql.NullString

	err := s.db.QueryRowContext(ctx,
		`SELECT id, group_id, user_id, name, slug, description, status, is_public, created_at, confirmed_at
		 FROM albums WHERE slug = $1 AND status = 'confirmed' AND is_public = true`,
		slug,
	).Scan(
		&album.ID, &album.GroupID, &album.UserID, &album.Name,
		&album.Slug, &description, &album.Status, &album.IsPublic,
		&album.CreatedAt, &confirmedAt,
	)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, errors.New("album not found")
		}
		return nil, err
	}

	if description.Valid {
		album.Description = &description.String
	}
	if confirmedAt.Valid {
		album.ConfirmedAt = &confirmedAt.Time
	}

	return album, nil
}

// ListByUser lists all albums for a user (as owner or member)
func (s *AlbumService) ListByUser(ctx context.Context, userID string) ([]Album, error) {
	rows, err := s.db.QueryContext(ctx,
		`SELECT a.id, a.group_id, a.user_id, a.name, a.slug, a.description, a.status, a.is_public, a.created_at, a.confirmed_at
		 FROM albums a
		 JOIN album_users au ON a.id = au.album_id
		 WHERE au.user_id = $1 AND a.status != 'deleted'
		 ORDER BY a.created_at DESC`,
		userID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var albums []Album
	for rows.Next() {
		var album Album
		var confirmedAt sql.NullTime
		var slug, description sql.NullString

		err := rows.Scan(
			&album.ID, &album.GroupID, &album.UserID, &album.Name,
			&slug, &description, &album.Status, &album.IsPublic,
			&album.CreatedAt, &confirmedAt,
		)
		if err != nil {
			return nil, err
		}

		if slug.Valid {
			album.Slug = &slug.String
		}
		if description.Valid {
			album.Description = &description.String
		}
		if confirmedAt.Valid {
			album.ConfirmedAt = &confirmedAt.Time
		}

		albums = append(albums, album)
	}

	return albums, rows.Err()
}

// Update updates an album (creates new version for confirmed albums)
func (s *AlbumService) Update(ctx context.Context, input UpdateAlbumInput) (*Album, error) {
	// Get current album
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

func (s *AlbumService) updateInPlace(ctx context.Context, current *Album, input UpdateAlbumInput) (*Album, error) {
	name := current.Name
	if input.Name != nil {
		name = *input.Name
	}
	slug := current.Slug
	if input.Slug != nil {
		slug = input.Slug
	}
	description := current.Description
	if input.Description != nil {
		description = input.Description
	}
	isPublic := current.IsPublic
	if input.IsPublic != nil {
		isPublic = *input.IsPublic
	}

	_, err := s.db.ExecContext(ctx,
		`UPDATE albums SET name = $1, slug = $2, description = $3, is_public = $4 WHERE id = $5`,
		name, slug, description, isPublic, current.ID,
	)
	if err != nil {
		return nil, err
	}

	return s.GetByID(ctx, current.ID)
}

func (s *AlbumService) createNewVersion(ctx context.Context, current *Album, input UpdateAlbumInput) (*Album, error) {
	newID := uuid.New().String()
	now := time.Now()

	name := current.Name
	if input.Name != nil {
		name = *input.Name
	}
	slug := current.Slug
	if input.Slug != nil {
		slug = input.Slug
	}
	description := current.Description
	if input.Description != nil {
		description = input.Description
	}
	isPublic := current.IsPublic
	if input.IsPublic != nil {
		isPublic = *input.IsPublic
	}

	// Mark old as deleted (soft delete via status)
	_, err := s.db.ExecContext(ctx,
		`UPDATE albums SET status = 'deleted' WHERE id = $1`,
		current.ID,
	)
	if err != nil {
		return nil, err
	}

	// Create new version
	album := &Album{
		ID:          newID,
		GroupID:     current.GroupID,
		UserID:      current.UserID,
		Name:        name,
		Slug:        slug,
		Description: description,
		Status:      "confirmed",
		IsPublic:    isPublic,
		CreatedAt:   now,
		ConfirmedAt: &now,
	}

	_, err = s.db.ExecContext(ctx,
		`INSERT INTO albums (id, group_id, user_id, name, slug, description, status, is_public, created_at, confirmed_at)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
		album.ID, album.GroupID, album.UserID, album.Name, album.Slug, album.Description,
		album.Status, album.IsPublic, album.CreatedAt, album.ConfirmedAt,
	)
	if err != nil {
		return nil, err
	}

	// Copy members to new version
	_, err = s.db.ExecContext(ctx,
		`INSERT INTO album_users (id, album_id, user_id, role, created_at)
		 SELECT $1 || id, $2, user_id, role, $3 FROM album_users WHERE album_id = $4`,
		newID[:8], newID, now, current.ID,
	)
	if err != nil {
		return nil, err
	}

	return album, nil
}

// Confirm confirms a staged album
func (s *AlbumService) Confirm(ctx context.Context, id string) (*Album, error) {
	now := time.Now()
	_, err := s.db.ExecContext(ctx,
		`UPDATE albums SET status = 'confirmed', confirmed_at = $1 WHERE id = $2 AND status = 'staged'`,
		now, id,
	)
	if err != nil {
		return nil, err
	}
	return s.GetByID(ctx, id)
}

// Delete soft-deletes an album
func (s *AlbumService) Delete(ctx context.Context, id string) error {
	_, err := s.db.ExecContext(ctx,
		`UPDATE albums SET status = 'deleted' WHERE id = $1`,
		id,
	)
	return err
}

// AddMember adds a user to an album
func (s *AlbumService) AddMember(ctx context.Context, albumID, userID, role string) (*AlbumMember, error) {
	member := &AlbumMember{
		ID:        uuid.New().String(),
		AlbumID:   albumID,
		UserID:    userID,
		Role:      role,
		CreatedAt: time.Now(),
	}

	_, err := s.db.ExecContext(ctx,
		`INSERT INTO album_users (id, album_id, user_id, role, created_at)
		 VALUES ($1, $2, $3, $4, $5)
		 ON CONFLICT (album_id, user_id) DO UPDATE SET role = $4`,
		member.ID, member.AlbumID, member.UserID, member.Role, member.CreatedAt,
	)
	if err != nil {
		return nil, err
	}

	return member, nil
}

// RemoveMember removes a user from an album
func (s *AlbumService) RemoveMember(ctx context.Context, albumID, userID string) error {
	_, err := s.db.ExecContext(ctx,
		`DELETE FROM album_users WHERE album_id = $1 AND user_id = $2`,
		albumID, userID,
	)
	return err
}

// ListMembers lists all members of an album
func (s *AlbumService) ListMembers(ctx context.Context, albumID string) ([]AlbumMember, error) {
	rows, err := s.db.QueryContext(ctx,
		`SELECT id, album_id, user_id, role, created_at
		 FROM album_users WHERE album_id = $1`,
		albumID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var members []AlbumMember
	for rows.Next() {
		var m AlbumMember
		err := rows.Scan(&m.ID, &m.AlbumID, &m.UserID, &m.Role, &m.CreatedAt)
		if err != nil {
			return nil, err
		}
		members = append(members, m)
	}

	return members, rows.Err()
}

// GetUserRole gets a user's role in an album
func (s *AlbumService) GetUserRole(ctx context.Context, albumID, userID string) (string, error) {
	var role string
	err := s.db.QueryRowContext(ctx,
		`SELECT role FROM album_users WHERE album_id = $1 AND user_id = $2`,
		albumID, userID,
	).Scan(&role)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return "", errors.New("user is not a member of this album")
		}
		return "", err
	}
	return role, nil
}
