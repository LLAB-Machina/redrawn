package services

import (
	"context"
	"errors"

	"redrawn/api/internal/api"
	"redrawn/api/internal/app"
	"redrawn/api/internal/errorsx"
	"redrawn/api/internal/generated"
	"redrawn/api/internal/generated/album"
	"redrawn/api/internal/generated/albumuser"
	"redrawn/api/internal/generated/originalphoto"
	"redrawn/api/internal/generated/user"
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
	// Count contributors (contributors + editors)
	contribCount, err := s.app.Db.AlbumUser.Query().
		Where(
			albumuser.HasAlbumWith(album.IDEQ(a.ID)),
			albumuser.Or(
				albumuser.RoleEQ(albumuser.RoleContributor),
				albumuser.RoleEQ(albumuser.RoleEditor),
			),
		).
		Count(ctx)
	if err != nil {
		return api.PublicAlbum{}, err
	}
	// Determine current user's role if any
	var memberRole string
	if uid, ok := app.UserIDFromContext(ctx); ok {
		if au, err := s.app.Db.AlbumUser.Query().
			Where(
				albumuser.HasAlbumWith(album.IDEQ(a.ID)),
				albumuser.HasUserWith(user.IDEQ(uid)),
			).
			Only(ctx); err == nil {
			memberRole = string(au.Role)
		}
	}
	return api.PublicAlbum{
		ID:               a.ID,
		Slug:             a.Slug,
		Name:             a.Name,
		Photos:           out,
		PhotoCount:       len(out),
		ContributorCount: contribCount,
		MemberRole:       memberRole,
	}, nil
}
