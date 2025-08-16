package handlers

import (
	"redrawn/api/internal/api"
	"redrawn/api/internal/app"
	"redrawn/api/internal/services"

	"github.com/go-fuego/fuego"
)

type albumCreateReq = api.AlbumCreateRequest

func RegisterAlbums(s *fuego.Server, a *app.App) {
	service := services.NewAlbumsService(a)

	fuego.Post(s, "/v1/albums", func(c fuego.ContextWithBody[albumCreateReq]) (api.Album, error) {
		body, err := BindAndValidate(c)
		if err != nil {
			return api.Album{}, err
		}
		return service.Create(c.Context(), body.Name, body.Slug, body.Visibility)
	})

	fuego.Get(s, "/v1/albums", func(c fuego.ContextNoBody) ([]api.Album, error) {
		return service.List(c.Context())
	})

	fuego.Get(s, "/v1/users/{email}/albums", func(c fuego.ContextNoBody) ([]api.Album, error) {
		email := c.PathParam("email")
		return service.ListByUser(c.Context(), email)
	})

	fuego.Get(s, "/v1/albums/{id}", func(c fuego.ContextNoBody) (api.Album, error) {
		id := c.PathParam("id")
		return service.Get(c.Context(), id)
	})

	fuego.Patch(
		s,
		"/v1/albums/{id}",
		func(c fuego.ContextWithBody[api.AlbumUpdateRequest]) (api.OkResponse, error) {
			body, err := BindAndValidate(c)
			if err != nil {
				return api.OkResponse{}, err
			}
			id := c.PathParam("id")
			if err := service.Update(c.Context(), id, body); err != nil {
				return api.OkResponse{}, err
			}
			return api.OkResponse{Ok: "true"}, nil
		},
	)

	fuego.Delete(s, "/v1/albums/{id}", func(c fuego.ContextNoBody) (api.OkResponse, error) {
		id := c.PathParam("id")
		if err := service.Delete(c.Context(), id); err != nil {
			return api.OkResponse{}, err
		}
		return api.OkResponse{Ok: "true"}, nil
	})
}
