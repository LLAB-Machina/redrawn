package handlers

import (
	"redrawn/api/internal/api"
	"redrawn/api/internal/app"
	"redrawn/api/internal/services"

	"github.com/go-fuego/fuego"
	"github.com/go-fuego/fuego/option"
)

type albumCreateReq = api.AlbumCreateRequest

func RegisterAlbums(s *fuego.Server, a *app.App) {
	service := services.NewAlbumsService(a)

	fuego.Post(s, "", func(c fuego.ContextWithBody[albumCreateReq]) (api.Album, error) {
		body, err := BindAndValidate(c)
		if err != nil {
			return api.Album{}, err
		}
		return service.Create(c.Context(), body.Name, body.Slug, body.Visibility)
	}, option.Summary("Create album"), option.OperationID("CreateAlbum"))

	fuego.Get(s, "", func(c fuego.ContextNoBody) ([]api.Album, error) {
		return service.List(c.Context())
	}, option.Summary("List albums"), option.OperationID("ListAlbums"))

	fuego.Get(
		s,
		"/slugs/{slug}/check",
		func(c fuego.ContextNoBody) (api.SlugCheckResponse, error) {
			slug := c.PathParam("slug")
			available, err := service.IsSlugAvailable(c.Context(), slug)
			if err != nil {
				return api.SlugCheckResponse{}, err
			}
			return api.SlugCheckResponse{Available: available}, nil
		},
		option.Summary("Check album slug availability"),
		option.OperationID("SlugAvailability"),
	)

	fuego.Get(s, "/email/{email}", func(c fuego.ContextNoBody) ([]api.Album, error) {
		email := c.PathParam("email")
		return service.ListByUser(c.Context(), email)
	}, option.Summary("List albums by user email"), option.OperationID("ListAlbumsByEmail"))

	fuego.Get(s, "/{id}", func(c fuego.ContextNoBody) (api.Album, error) {
		id := c.PathParam("id")
		return service.Get(c.Context(), id)
	}, option.Summary("Get album by id"), option.OperationID("GetAlbumById"))

	fuego.Patch(
		s,
		"/{id}",
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
		option.Summary("Update album"),
		option.OperationID("UpdateAlbum"),
	)

	fuego.Delete(s, "/{id}", func(c fuego.ContextNoBody) (api.OkResponse, error) {
		id := c.PathParam("id")
		if err := service.Delete(c.Context(), id); err != nil {
			return api.OkResponse{}, err
		}
		return api.OkResponse{Ok: "true"}, nil
	}, option.Summary("Delete album"), option.OperationID("DeleteAlbum"))
}
