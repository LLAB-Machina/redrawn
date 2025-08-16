package services

import (
	"context"
	"errors"

	"redrawn/api/internal/api"
	"redrawn/api/internal/app"
	"redrawn/api/internal/errorsx"
	"redrawn/api/internal/generated"
	"redrawn/api/internal/generated/album"
	"redrawn/api/internal/generated/originalphoto"
)

type PublicService struct{ app *app.App }

func NewPublicService(a *app.App) *PublicService { return &PublicService{app: a} }

func (s *PublicService) AlbumBySlug(ctx context.Context, slug string) (api.PublicAlbum, error) {
	a, err := s.app.Db.Album.Query().Where(album.Slug(slug)).Only(ctx)
	if err != nil {
		if generated.IsNotFound(err) {
			return api.PublicAlbum{}, errorsx.ErrNotFound
		}
		return api.PublicAlbum{}, err
	}
	if a.Visibility == album.VisibilityInviteOnly {
		return api.PublicAlbum{}, errors.New("not public")
	}
	photos, err := s.app.Db.OriginalPhoto.Query().
		Where(originalphoto.HasAlbumWith(album.IDEQ(a.ID))).
		WithFile().
		All(ctx)
	if err != nil {
		return api.PublicAlbum{}, err
	}
	out := []api.PublicPhoto{}
	for _, o := range photos {
		p := api.PublicPhoto{ID: o.ID}
		if o.Edges.File != nil {
			p.FileID = o.Edges.File.ID
		}
		out = append(out, p)
	}
	return api.PublicAlbum{ID: a.ID, Slug: a.Slug, Name: a.Name, Photos: out}, nil
}
