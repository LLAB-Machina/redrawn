package handlers

import (
	"redrawn/api/internal/api"
	"redrawn/api/internal/app"
	"redrawn/api/internal/services"

	"github.com/go-fuego/fuego"
)

type albumCreateReq = api.AlbumCreateRequest

func RegisterAlbums(s *fuego.Server, a *app.App) {
	svc := services.NewAlbumsService(a)

	fuego.Post(s, "/v1/albums", func(c fuego.ContextWithBody[albumCreateReq]) (api.Album, error) {
		body, err := c.Body()
		if err != nil {
			return api.Album{}, err
		}
		return svc.Create(c.Context(), body.Name, body.Slug, body.Visibility)
	})

	fuego.Get(s, "/v1/albums", func(c fuego.ContextNoBody) ([]api.Album, error) {
		return svc.List(c.Context())
	})

	fuego.Get(s, "/v1/users/{handle}/albums", func(c fuego.ContextNoBody) ([]api.Album, error) {
		// NOTE: In real code, extract handle from path if needed by framework
		return svc.ListByUser(c.Context(), "{handle}")
	})

	fuego.Get(s, "/v1/albums/{id}", func(c fuego.ContextNoBody) (api.Album, error) {
		return svc.Get(c.Context(), "{id}")
	})

	fuego.Patch(s, "/v1/albums/{id}", func(c fuego.ContextWithBody[api.AlbumUpdateRequest]) (api.OkResponse, error) {
		body, err := c.Body()
		if err != nil {
			return api.OkResponse{}, err
		}
		payload := map[string]any{}
		if body.Name != nil {
			payload["name"] = *body.Name
		}
		if body.Slug != nil {
			payload["slug"] = *body.Slug
		}
		if body.Visibility != nil {
			payload["visibility"] = *body.Visibility
		}
		if err := svc.Update(c.Context(), "{id}", payload); err != nil {
			return api.OkResponse{}, err
		}
		return api.OkResponse{Ok: "true"}, nil
	})

	fuego.Delete(s, "/v1/albums/{id}", func(c fuego.ContextNoBody) (api.OkResponse, error) {
		if err := svc.Delete(c.Context(), "{id}"); err != nil {
			return api.OkResponse{}, err
		}
		return api.OkResponse{Ok: "true"}, nil
	})
}
