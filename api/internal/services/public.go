package services

import (
	"context"
	"errors"

	"redrawn/api/ent/album"
	"redrawn/api/ent/originalphoto"
	"redrawn/api/internal/api"
	"redrawn/api/internal/app"
)

type PublicService struct{ app *app.App }

func NewPublicService(a *app.App) *PublicService { return &PublicService{app: a} }

func (s *PublicService) AlbumBySlug(ctx context.Context, slug string) (api.PublicAlbum, error) {
	a, err := s.app.Ent.Album.Query().Where(album.Slug(slug)).Only(ctx)
	if err != nil {
		return api.PublicAlbum{}, err
	}
	if a.Visibility == album.VisibilityPrivate {
		return api.PublicAlbum{}, errors.New("not public")
	}
	photos, err := s.app.Ent.OriginalPhoto.Query().
		Where(originalphoto.HasAlbumWith(album.IDEQ(a.ID))).
		WithFile().
		All(ctx)
	if err != nil {
		return api.PublicAlbum{}, err
	}
	out := []api.PublicPhoto{}
	for _, o := range photos {
		p := api.PublicPhoto{ID: o.ID.String()}
		if o.Edges.File != nil {
			p.FileID = o.Edges.File.ID.String()
		}
		out = append(out, p)
	}
	return api.PublicAlbum{ID: a.ID.String(), Slug: a.Slug, Name: a.Name, Photos: out}, nil
}
