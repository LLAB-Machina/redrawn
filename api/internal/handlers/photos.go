package handlers

import (
	"redrawn/api/internal/api"
	"redrawn/api/internal/app"
	"redrawn/api/internal/services"

	"github.com/go-fuego/fuego"
	"github.com/go-fuego/fuego/option"
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
		"/{id}/uploads",
		func(c fuego.ContextWithBody[uploadInitReq]) (api.UploadInitResponse, error) {
			body, err := BindAndValidate(c)
			if err != nil {
				return api.UploadInitResponse{}, err
			}
			id := c.PathParam("id")
			return service.InitUpload(c.Context(), id, body.Name, body.Mime, body.Size)
		},
		option.Summary("Initialize file upload for album"),
		option.OperationID("InitPhotoUpload"),
	)

	fuego.Post(
		s,
		"originals/{id}",
		func(c fuego.ContextWithBody[createOriginalReq]) (api.IDResponse, error) {
			body, err := BindAndValidate(c)
			if err != nil {
				return api.IDResponse{}, err
			}
			id := c.PathParam("id")
			return service.CreateOriginal(c.Context(), id, body.FileID)
		},
		option.Summary("Create original photo record"),
		option.OperationID("CreateOriginalPhoto"),
	)

	fuego.Get(
		s,
		"originals/{id}",
		func(c fuego.ContextNoBody) ([]api.OriginalPhoto, error) {
			id := c.PathParam("id")
			return service.ListOriginals(c.Context(), id)
		},
		option.Summary("List original photos for album"),
		option.OperationID("ListOriginalPhotos"),
	)

	fuego.Post(
		s,
		"/originals/generate/{id}",
		func(c fuego.ContextWithBody[genReq]) (api.TaskResponse, error) {
			body, err := BindAndValidate(c)
			if err != nil {
				return api.TaskResponse{}, err
			}
			id := c.PathParam("id")
			return service.Generate(c.Context(), id, body.ThemeID)
		},
		option.Summary("Generate original photo from theme"),
		option.OperationID("GenerateOriginalPhoto"),
	)

	fuego.Get(
		s,
		"/originals/generated/{id}",
		func(c fuego.ContextNoBody) ([]api.GeneratedPhoto, error) {
			id := c.PathParam("id")
			return service.ListGenerated(c.Context(), id)
		},
		option.Summary("List generated photos for album"),
		option.OperationID("ListGeneratedPhotos"),
	)

	fuego.Get(s, "/files/url/{id}", func(c fuego.ContextNoBody) (api.URLResponse, error) {
		id := c.PathParam("id")
		url, err := service.FileURL(c.Context(), id)
		if err != nil {
			return api.URLResponse{}, err
		}
		return api.URLResponse{URL: url}, nil
	}, option.Summary("Get signed file URL"), option.OperationID("GetPhotoFileURL"))

	fuego.Get(s, "/tasks/{id}", func(c fuego.ContextNoBody) (api.TaskStatusResponse, error) {
		if a.Queue == nil {
			return api.TaskStatusResponse{Status: "unknown"}, nil
		}
		id := c.PathParam("id")
		if status, ok := a.Queue.GetStatus(id); ok {
			return api.TaskStatusResponse{Status: status}, nil
		}
		return api.TaskStatusResponse{Status: "not_found"}, nil
	}, option.Summary("Get photo task status"), option.OperationID("GetPhotoTaskStatus"))
}
