package handlers

import (
	"redrawn/api/internal/api"
	"redrawn/api/internal/app"
	"redrawn/api/internal/services"

	"github.com/go-fuego/fuego"
)

type (
	uploadInitReq     = api.UploadInitRequest
	createOriginalReq = api.CreateOriginalRequest
	genReq            = api.GenerateRequest
)

func RegisterPhotos(s *fuego.Server, a *app.App) {
	service := services.NewPhotosService(a)

	fuego.Post(
		s,
		"/v1/albums/{id}/uploads",
		func(c fuego.ContextWithBody[uploadInitReq]) (api.UploadInitResponse, error) {
			body, err := BindAndValidate(c)
			if err != nil {
				return api.UploadInitResponse{}, err
			}
			id := c.PathParam("id")
			return service.InitUpload(c.Context(), id, body.Name, body.Mime, body.Size)
		},
	)

	fuego.Post(
		s,
		"/v1/albums/{id}/originals",
		func(c fuego.ContextWithBody[createOriginalReq]) (api.IDResponse, error) {
			body, err := BindAndValidate(c)
			if err != nil {
				return api.IDResponse{}, err
			}
			id := c.PathParam("id")
			return service.CreateOriginal(c.Context(), id, body.FileID)
		},
	)

	fuego.Get(
		s,
		"/v1/albums/{id}/originals",
		func(c fuego.ContextNoBody) ([]api.OriginalPhoto, error) {
			id := c.PathParam("id")
			return service.ListOriginals(c.Context(), id)
		},
	)

	fuego.Post(
		s,
		"/v1/originals/{id}/generate",
		func(c fuego.ContextWithBody[genReq]) (api.TaskResponse, error) {
			body, err := BindAndValidate(c)
			if err != nil {
				return api.TaskResponse{}, err
			}
			id := c.PathParam("id")
			return service.Generate(c.Context(), id, body.ThemeID)
		},
	)

	fuego.Get(
		s,
		"/v1/originals/{id}/generated",
		func(c fuego.ContextNoBody) ([]api.GeneratedPhoto, error) {
			id := c.PathParam("id")
			return service.ListGenerated(c.Context(), id)
		},
	)

	fuego.Get(s, "/v1/files/{id}/url", func(c fuego.ContextNoBody) (api.URLResponse, error) {
		id := c.PathParam("id")
		url, err := service.FileURL(c.Context(), id)
		if err != nil {
			return api.URLResponse{}, err
		}
		return api.URLResponse{URL: url}, nil
	})

	fuego.Get(s, "/v1/tasks/{id}", func(c fuego.ContextNoBody) (api.TaskStatusResponse, error) {
		if a.Queue == nil {
			return api.TaskStatusResponse{Status: "unknown"}, nil
		}
		id := c.PathParam("id")
		if status, ok := a.Queue.GetStatus(id); ok {
			return api.TaskStatusResponse{Status: status}, nil
		}
		return api.TaskStatusResponse{Status: "not_found"}, nil
	})
}
