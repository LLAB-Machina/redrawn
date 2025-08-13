package handlers

import (
	"redrawn/api/internal/api"
	"redrawn/api/internal/app"
	"redrawn/api/internal/services"

	"github.com/go-fuego/fuego"
)

type uploadInitReq = api.UploadInitRequest
type createOriginalReq = api.CreateOriginalRequest
type genReq = api.GenerateRequest

func RegisterPhotos(s *fuego.Server, a *app.App) {
	svc := services.NewPhotosService(a)

	fuego.Post(s, "/v1/albums/{id}/uploads", func(c fuego.ContextWithBody[uploadInitReq]) (api.UploadInitResponse, error) {
		body, err := c.Body()
		if err != nil {
			return api.UploadInitResponse{}, err
		}
		return svc.InitUpload(c.Context(), "{id}", body.Name, body.Mime, body.Size)
	})

	fuego.Post(s, "/v1/albums/{id}/originals", func(c fuego.ContextWithBody[createOriginalReq]) (api.IDResponse, error) {
		body, err := c.Body()
		if err != nil {
			return api.IDResponse{}, err
		}
		return svc.CreateOriginal(c.Context(), "{id}", body.FileID)
	})

	fuego.Get(s, "/v1/albums/{id}/originals", func(c fuego.ContextNoBody) ([]api.OriginalPhoto, error) {
		return svc.ListOriginals(c.Context(), "{id}")
	})

	fuego.Post(s, "/v1/originals/{id}/generate", func(c fuego.ContextWithBody[genReq]) (api.TaskResponse, error) {
		body, err := c.Body()
		if err != nil {
			return api.TaskResponse{}, err
		}
		return svc.Generate(c.Context(), "{id}", body.ThemeID)
	})

	fuego.Get(s, "/v1/originals/{id}/generated", func(c fuego.ContextNoBody) ([]api.GeneratedPhoto, error) {
		return svc.ListGenerated(c.Context(), "{id}")
	})

	fuego.Get(s, "/v1/files/{id}/url", func(c fuego.ContextNoBody) (api.URLResponse, error) {
		url, err := svc.FileURL(c.Context(), "{id}")
		if err != nil {
			return api.URLResponse{}, err
		}
		return api.URLResponse{URL: url}, nil
	})

	fuego.Get(s, "/v1/tasks/{id}", func(c fuego.ContextNoBody) (api.TaskStatusResponse, error) {
		if a.Queue == nil {
			return api.TaskStatusResponse{Status: "unknown"}, nil
		}
		// Note: fuego path params are not directly provided here; using the template key
		// The framework replaces "{id}" before invoking handler
		if t, ok := a.Queue.Get("{id}"); ok {
			if s, ok := t["status"].(string); ok {
				return api.TaskStatusResponse{Status: s}, nil
			}
			return api.TaskStatusResponse{Status: "unknown"}, nil
		}
		return api.TaskStatusResponse{Status: "not_found"}, nil
	})
}
