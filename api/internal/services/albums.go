package services

import (
	"context"
	"strings"
	"time"

	"redrawn/api/internal/api"
	"redrawn/api/internal/app"
	"redrawn/api/internal/errorsx"
	"redrawn/api/internal/generated"
	"redrawn/api/internal/generated/album"
	"redrawn/api/internal/generated/user"
)

type AlbumsService struct {
	app *app.App
}

func NewAlbumsService(a *app.App) *AlbumsService { return &AlbumsService{app: a} }

func (s *AlbumsService) Create(
	ctx context.Context,
	name, slug, visibility string,
) (api.Album, error) {
	uid, ok := app.UserIDFromContext(ctx)
	if !ok {
		return api.Album{}, errorsx.ErrUnauthorized
	}
	owner, err := s.app.Db.User.Query().Where(user.IDEQ(uid)).Only(ctx)
	if err != nil {
		if generated.IsNotFound(err) {
			return api.Album{}, errorsx.ErrNotFound
		}
		return api.Album{}, err
	}
	a, err := s.app.Db.Album.
		Create().
		SetName(name).
		SetSlug(slug).
		SetVisibility(album.Visibility(visibility)).
		SetCreatedBy(owner).
		Save(ctx)
	if err != nil {
		return api.Album{}, err
	}
	return api.Album{ID: a.ID, Name: a.Name, Slug: a.Slug, Visibility: string(a.Visibility)}, nil
}

func (s *AlbumsService) List(ctx context.Context) ([]api.Album, error) {
	uid, ok := app.UserIDFromContext(ctx)
	if !ok {
		return nil, errorsx.ErrUnauthorized
	}
	items, err := s.app.Db.Album.Query().
		Where(album.HasCreatedByWith(user.IDEQ(uid))).
		Where(album.DeletedAtIsNil()).
		Order(generated.Asc(album.FieldCreatedAt)).
		All(ctx)
	if err != nil {
		return nil, err
	}
	out := make([]api.Album, 0, len(items))
	for _, a := range items {
		out = append(
			out,
			api.Album{ID: a.ID, Name: a.Name, Slug: a.Slug, Visibility: string(a.Visibility)},
		)
	}
	return out, nil
}

func (s *AlbumsService) ListByUser(ctx context.Context, email string) ([]api.Album, error) {
	u, err := s.app.Db.User.Query().Where(user.EmailEQ(email)).Only(ctx)
	if err != nil {
		if generated.IsNotFound(err) {
			return nil, errorsx.ErrNotFound
		}
		return nil, err
	}
	items, err := s.app.Db.Album.Query().
		Where(album.HasCreatedByWith(user.IDEQ(u.ID)), album.DeletedAtIsNil()).
		All(ctx)
	if err != nil {
		return nil, err
	}
	out := make([]api.Album, 0, len(items))
	for _, a := range items {
		out = append(out, api.Album{ID: a.ID, Name: a.Name, Slug: a.Slug})
	}
	return out, nil
}

func (s *AlbumsService) Get(ctx context.Context, id string) (api.Album, error) {
	a, err := s.app.Db.Album.Get(ctx, id)
	if err != nil {
		if generated.IsNotFound(err) {
			return api.Album{}, errorsx.ErrNotFound
		}
		return api.Album{}, err
	}
	// If soft-deleted, treat as not found
	if a.DeletedAt != nil {
		return api.Album{}, errorsx.ErrNotFound
	}
	return api.Album{ID: a.ID, Name: a.Name, Slug: a.Slug, Visibility: string(a.Visibility)}, nil
}

func (s *AlbumsService) Update(ctx context.Context, id string, req api.AlbumUpdateRequest) error {
	m := s.app.Db.Album.UpdateOneID(id)
	if req.Name != nil && *req.Name != "" {
		m.SetName(*req.Name)
	}
	if req.Slug != nil && *req.Slug != "" {
		m.SetSlug(*req.Slug)
	}
	if req.Visibility != nil && *req.Visibility != "" {
		m.SetVisibility(album.Visibility(*req.Visibility))
	}
	return m.Exec(ctx)
}

func (s *AlbumsService) Delete(ctx context.Context, id string) error {
	// Soft-delete
	return s.app.Db.Album.UpdateOneID(id).SetDeletedAt(time.Now()).Exec(ctx)
}

// IsSlugAvailable returns (available, reserved, error).
func (s *AlbumsService) IsSlugAvailable(ctx context.Context, slug string) (bool, error) {
	normalized := strings.ToLower(strings.TrimSpace(slug))
	if normalized == "" {
		return false, nil
	}
	// Reserved words that should never be allowed as slugs
	switch normalized {
	case "new", "edit", "id":
		return false, nil
	}
	exists, err := s.app.Db.Album.Query().
		Where(album.SlugEQ(normalized)).
		Where(album.DeletedAtIsNil()).
		Exist(ctx)
	if err != nil {
		return false, err
	}
	return !exists, nil
}
