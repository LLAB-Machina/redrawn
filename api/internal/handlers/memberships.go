package handlers

import (
	"redrawn/api/internal/api"
	"redrawn/api/internal/app"
	"redrawn/api/internal/services"

	"github.com/go-fuego/fuego"
)

type inviteReq = api.InviteRequest
type roleReq = api.RoleRequest

func RegisterMembership(s *fuego.Server, a *app.App) {
	svc := services.NewMembershipService(a)

	fuego.Post(s, "/v1/albums/{id}/invites", func(c fuego.ContextWithBody[inviteReq]) (api.StatusResponse, error) {
		body, err := BindAndValidate(c)
		if err != nil {
			return api.StatusResponse{}, err
		}
		albumID := c.PathParam("id")
		if err := svc.Invite(c.Context(), albumID, body.Email, body.Role); err != nil {
			return api.StatusResponse{}, err
		}
		return api.StatusResponse{Status: "invited"}, nil
	})

	fuego.Post(s, "/v1/albums/{id}/members/{userId}", func(c fuego.ContextWithBody[roleReq]) (api.OkResponse, error) {
		body, err := BindAndValidate(c)
		if err != nil {
			return api.OkResponse{}, err
		}
		albumID := c.PathParam("id")
		userID := c.PathParam("userId")
		if err := svc.SetRole(c.Context(), albumID, userID, body.Role); err != nil {
			return api.OkResponse{}, err
		}
		return api.OkResponse{Ok: "true"}, nil
	})

	fuego.Delete(s, "/v1/albums/{id}/members/{userId}", func(c fuego.ContextNoBody) (api.OkResponse, error) {
		albumID := c.PathParam("id")
		userID := c.PathParam("userId")
		if err := svc.Remove(c.Context(), albumID, userID); err != nil {
			return api.OkResponse{}, err
		}
		return api.OkResponse{Ok: "true"}, nil
	})
}
