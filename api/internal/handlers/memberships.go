package handlers

import (
	"redrawn/api/internal/api"
	appctx "redrawn/api/internal/app"
	"redrawn/api/internal/services"

	"github.com/go-fuego/fuego"
)

type inviteReq = api.InviteRequest

type roleReq = api.RoleRequest

func RegisterMembership(s *fuego.Server, a *appctx.App) {
	svc := services.NewMembershipService(a)

	fuego.Post(s, "/v1/albums/{id}/invites", func(c fuego.ContextWithBody[inviteReq]) (api.StatusResponse, error) {
		body, err := BindAndValidate(c)
		if err != nil {
			return api.StatusResponse{}, err
		}
		albumID := c.PathParam("id")
		uid, ok := appctx.UserIDFromContext(c.Context())
		if !ok || uid == "" {
			return api.StatusResponse{}, errUnauthorized
		}
		if err := svc.Invite(c.Context(), albumID, body.Email, body.Role, uid); err != nil {
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

	// List current members, pending invites, and invite links
	fuego.Get(s, "/v1/albums/{id}/memberships", func(c fuego.ContextNoBody) (api.MembershipsResponse, error) {
		albumID := c.PathParam("id")
		return svc.List(c.Context(), albumID)
	})

	// Create an invite link
	fuego.Post(s, "/v1/albums/{id}/invite_links", func(c fuego.ContextWithBody[api.CreateInviteLinkRequest]) (api.InviteLink, error) {
		body, err := BindAndValidate(c)
		if err != nil {
			return api.InviteLink{}, err
		}
		albumID := c.PathParam("id")
		uid, _ := appctx.UserIDFromContext(c.Context())
		return svc.CreateLink(c.Context(), albumID, body, uid)
	})

	// Revoke an invite link
	fuego.Delete(s, "/v1/albums/{id}/invite_links/{linkId}", func(c fuego.ContextNoBody) (api.OkResponse, error) {
		albumID := c.PathParam("id")
		linkID := c.PathParam("linkId")
		if err := svc.RevokeLink(c.Context(), albumID, linkID); err != nil {
			return api.OkResponse{}, err
		}
		return api.OkResponse{Ok: "true"}, nil
	})

	// Accept an invite link with a token for the current user
	fuego.Post(s, "/v1/albums/{id}/invite_links/accept/{token}", func(c fuego.ContextNoBody) (api.OkResponse, error) {
		albumID := c.PathParam("id")
		token := c.PathParam("token")
		uid, ok := appctx.UserIDFromContext(c.Context())
		if !ok || uid == "" {
			return api.OkResponse{}, errUnauthorized
		}
		if err := svc.AcceptLink(c.Context(), albumID, token, uid); err != nil {
			return api.OkResponse{}, err
		}
		return api.OkResponse{Ok: "true"}, nil
	})

	// Pending email invites management: revoke and update role
	fuego.Delete(s, "/v1/albums/{id}/invites/{inviteId}", func(c fuego.ContextNoBody) (api.OkResponse, error) {
		albumID := c.PathParam("id")
		inviteID := c.PathParam("inviteId")
		if err := svc.RevokeInvite(c.Context(), albumID, inviteID); err != nil {
			return api.OkResponse{}, err
		}
		return api.OkResponse{Ok: "true"}, nil
	})

	fuego.Post(s, "/v1/albums/{id}/invites/{inviteId}", func(c fuego.ContextWithBody[roleReq]) (api.OkResponse, error) {
		body, err := BindAndValidate(c)
		if err != nil {
			return api.OkResponse{}, err
		}
		albumID := c.PathParam("id")
		inviteID := c.PathParam("inviteId")
		if err := svc.UpdateInviteRole(c.Context(), albumID, inviteID, body.Role); err != nil {
			return api.OkResponse{}, err
		}
		return api.OkResponse{Ok: "true"}, nil
	})
}
