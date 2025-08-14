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
		handle := c.PathParam("handle")
		return svc.ListByUser(c.Context(), handle)
	})

	fuego.Get(s, "/v1/albums/{id}", func(c fuego.ContextNoBody) (api.Album, error) {
		id := c.PathParam("id")
		return svc.Get(c.Context(), id)
	})

	fuego.Patch(s, "/v1/albums/{id}", func(c fuego.ContextWithBody[api.AlbumUpdateRequest]) (api.OkResponse, error) {
		body, err := c.Body()
		if err != nil {
			return api.OkResponse{}, err
		}
		id := c.PathParam("id")
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
		if err := svc.Update(c.Context(), id, payload); err != nil {
			return api.OkResponse{}, err
		}
		return api.OkResponse{Ok: "true"}, nil
	})

	fuego.Delete(s, "/v1/albums/{id}", func(c fuego.ContextNoBody) (api.OkResponse, error) {
		id := c.PathParam("id")
		if err := svc.Delete(c.Context(), id); err != nil {
			return api.OkResponse{}, err
		}
		return api.OkResponse{Ok: "true"}, nil
	})
}
