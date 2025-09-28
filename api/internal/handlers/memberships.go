package handlers

import (
	"redrawn/api/internal/api"
	appctx "redrawn/api/internal/app"
	"redrawn/api/internal/errorsx"
	"redrawn/api/internal/services"

	"github.com/go-fuego/fuego"
	"github.com/go-fuego/fuego/option"
)

type inviteReq = api.InviteRequest

type roleReq = api.RoleRequest

func RegisterMembership(s *fuego.Server, a *appctx.App) {
	service := services.NewMembershipService(a)

	fuego.Post(
		s,
		"/{id}/invites",
		func(c fuego.ContextWithBody[inviteReq]) (api.StatusResponse, error) {
			body, err := BindAndValidate(c)
			if err != nil {
				return api.StatusResponse{}, err
			}
			albumID := c.PathParam("id")
			uid, ok := appctx.UserIDFromContext(c.Context())
			if !ok || uid == "" {
				return api.StatusResponse{}, errorsx.ErrUnauthorized
			}
			if err := service.Invite(c.Context(), albumID, body.Email, body.Role, uid); err != nil {
				return api.StatusResponse{}, err
			}
			return api.StatusResponse{Status: "invited"}, nil
		},
		option.Summary("Invite user to album by email"),
		option.OperationID("InviteToAlbum"),
	)

	fuego.Post(
		s,
		"/{id}/members/{userId}",
		func(c fuego.ContextWithBody[roleReq]) (api.OkResponse, error) {
			body, err := BindAndValidate(c)
			if err != nil {
				return api.OkResponse{}, err
			}
			albumID := c.PathParam("id")
			userID := c.PathParam("userId")
			if err := service.SetRole(c.Context(), albumID, userID, body.Role); err != nil {
				return api.OkResponse{}, err
			}
			return api.OkResponse{Ok: "true"}, nil
		},
		option.Summary("Set album member role"),
		option.OperationID("SetAlbumMemberRole"),
	)

	fuego.Delete(
		s,
		"/{id}/members/{userId}",
		func(c fuego.ContextNoBody) (api.OkResponse, error) {
			albumID := c.PathParam("id")
			userID := c.PathParam("userId")
			if err := service.Remove(c.Context(), albumID, userID); err != nil {
				return api.OkResponse{}, err
			}
			return api.OkResponse{Ok: "true"}, nil
		},
		option.Summary("Remove album member"),
		option.OperationID("RemoveAlbumMember"),
	)

	// List current members, pending invites, and invite links
	fuego.Get(
		s,
		"/{id}/memberships",
		func(c fuego.ContextNoBody) (api.MembershipsResponse, error) {
			albumID := c.PathParam("id")
			return service.List(c.Context(), albumID)
		},
		option.Summary("List album members and invites"),
		option.OperationID("Memberships_List"),
	)

	// Create an invite link
	fuego.Post(
		s,
		"/{id}/invite_links",
		func(c fuego.ContextWithBody[api.CreateInviteLinkRequest]) (api.InviteLink, error) {
			body, err := BindAndValidate(c)
			if err != nil {
				return api.InviteLink{}, err
			}
			albumID := c.PathParam("id")
			uid, _ := appctx.UserIDFromContext(c.Context())
			return service.CreateLink(c.Context(), albumID, body, uid)
		},
		option.Summary("Create album invite link"),
		option.OperationID("CreateAlbumInviteLink"),
	)

	// Revoke an invite link
	fuego.Delete(
		s,
		"/{id}/invite_links/{linkId}",
		func(c fuego.ContextNoBody) (api.OkResponse, error) {
			albumID := c.PathParam("id")
			linkID := c.PathParam("linkId")
			if err := service.RevokeLink(c.Context(), albumID, linkID); err != nil {
				return api.OkResponse{}, err
			}
			return api.OkResponse{Ok: "true"}, nil
		},
		option.Summary("Revoke album invite link"),
		option.OperationID("RevokeAlbumLinkInvite"),
	)

	// Accept an invite link with a token for the current user
	fuego.Post(
		s,
		"/{id}/invite_links/accept/{token}",
		func(c fuego.ContextNoBody) (api.OkResponse, error) {
			albumID := c.PathParam("id")
			token := c.PathParam("token")
			uid, ok := appctx.UserIDFromContext(c.Context())
			if !ok || uid == "" {
				return api.OkResponse{}, errorsx.ErrUnauthorized
			}
			if err := service.AcceptLink(c.Context(), albumID, token, uid); err != nil {
				return api.OkResponse{}, err
			}
			return api.OkResponse{Ok: "true"}, nil
		},
		option.Summary("Accept album invite link"),
		option.OperationID("AcceptAlbumInviteLink"),
	)

	// public preview route is registered in handlers.RegisterPublic

	// Pending email invites management: revoke and update role
	fuego.Delete(
		s,
		"/{id}/invites/{inviteId}",
		func(c fuego.ContextNoBody) (api.OkResponse, error) {
			albumID := c.PathParam("id")
			inviteID := c.PathParam("inviteId")
			if err := service.RevokeInvite(c.Context(), albumID, inviteID); err != nil {
				return api.OkResponse{}, err
			}
			return api.OkResponse{Ok: "true"}, nil
		},
		option.Summary("Revoke pending email invite"),
		option.OperationID("RevokeAlbumEmailInvite"),
	)

	fuego.Post(
		s,
		"/{id}/invites/{inviteId}",
		func(c fuego.ContextWithBody[roleReq]) (api.OkResponse, error) {
			body, err := BindAndValidate(c)
			if err != nil {
				return api.OkResponse{}, err
			}
			albumID := c.PathParam("id")
			inviteID := c.PathParam("inviteId")
			if err := service.UpdateInviteRole(c.Context(), albumID, inviteID, body.Role); err != nil {
				return api.OkResponse{}, err
			}
			return api.OkResponse{Ok: "true"}, nil
		},
		option.Summary("Update pending invite role"),
		option.OperationID("UpdateAlbumEmailInviteRole"),
	)
}
