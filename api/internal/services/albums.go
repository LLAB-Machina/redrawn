package services

import (
	"context"
	"errors"

	"redrawn/api/ent"
	"redrawn/api/ent/album"
	"redrawn/api/ent/user"
	"redrawn/api/internal/api"
	"redrawn/api/internal/app"
)

type AlbumsService struct {
	app *app.App
}

func NewAlbumsService(a *app.App) *AlbumsService { return &AlbumsService{app: a} }

func (s *AlbumsService) Create(ctx context.Context, name, slug, visibility string) (api.Album, error) {
	uid, ok := app.UserIDFromContext(ctx)
	if !ok {
		return api.Album{}, errors.New("unauthorized")
	}
	owner, err := s.app.Ent.User.Query().Where(user.IDEQ(uid)).Only(ctx)
	if err != nil {
		return api.Album{}, err
	}
	a, err := s.app.Ent.Album.
		Create().
		SetName(name).
		SetSlug(slug).
		SetVisibility(album.Visibility(visibility)).
		SetOwner(owner).
		Save(ctx)
	if err != nil {
		return api.Album{}, err
	}
	return api.Album{ID: a.ID, Name: a.Name, Slug: a.Slug, Visibility: string(a.Visibility)}, nil
}

func (s *AlbumsService) List(ctx context.Context) ([]api.Album, error) {
	uid, ok := app.UserIDFromContext(ctx)
	if !ok {
		return nil, errors.New("unauthorized")
	}
	items, err := s.app.Ent.Album.Query().
		Where(album.HasOwnerWith(user.IDEQ(uid))).
		Order(ent.Asc(album.FieldCreatedAt)).
		All(ctx)
	if err != nil {
		return nil, err
	}
	out := make([]api.Album, 0, len(items))
	for _, a := range items {
		out = append(out, api.Album{ID: a.ID, Name: a.Name, Slug: a.Slug, Visibility: string(a.Visibility)})
	}
	return out, nil
}

func (s *AlbumsService) ListByUser(ctx context.Context, email string) ([]api.Album, error) {
	u, err := s.app.Ent.User.Query().Where(user.EmailEQ(email)).Only(ctx)
	if err != nil {
		return nil, err
	}
	items, err := s.app.Ent.Album.Query().Where(album.HasOwnerWith(user.IDEQ(u.ID))).All(ctx)
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
	a, err := s.app.Ent.Album.Get(ctx, id)
	if err != nil {
		return api.Album{}, err
	}
	return api.Album{ID: a.ID, Name: a.Name, Slug: a.Slug, Visibility: string(a.Visibility)}, nil
}

func (s *AlbumsService) Update(ctx context.Context, id string, req api.AlbumUpdateRequest) error {
	m := s.app.Ent.Album.UpdateOneID(id)
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
	return s.app.Ent.Album.DeleteOneID(id).Exec(ctx)
}
