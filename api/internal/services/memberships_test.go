package services

import (
	"context"
	"testing"

	api "redrawn/api/internal/api"
	appctx "redrawn/api/internal/app"
	"redrawn/api/internal/generated/album"
	"redrawn/api/internal/testutil"
)

func TestMemberships_LinkLifecycle(t *testing.T) {
	a := testutil.NewTestApp(t)
	defer testutil.CloseTestApp(t, a)
	ms := NewMembershipService(a)
	as := NewAlbumsService(a)

	// Seed creator and target user
	ownerID := testutil.MustCreateUser(t, a, "owner@example.com")
	userID := testutil.MustCreateUser(t, a, "joiner@example.com")
	ctx := appctx.WithUserID(context.Background(), ownerID)

	// Create album via service to satisfy FK
	created, err := as.Create(ctx, "Team", "team", string(album.VisibilityInviteOnly))
	if err != nil {
		t.Fatalf("album create: %v", err)
	}

	// Create an invite link
	link, err := ms.CreateLink(
		ctx,
		created.ID,
		api.CreateInviteLinkRequest{Role: "viewer"},
		ownerID,
	)
	if err != nil {
		t.Fatalf("create link: %v", err)
	}
	if link.Token == "" {
		t.Fatalf("expected token")
	}

	// Accept the link as the other user
	userCtx := appctx.WithUserID(context.Background(), userID)
	if err := ms.AcceptLink(userCtx, created.ID, link.Token, userID); err != nil {
		t.Fatalf("accept link: %v", err)
	}

	// Revoke the link, and ensure accepting again fails
	if err := ms.RevokeLink(ctx, created.ID, link.ID); err != nil {
		t.Fatalf("revoke link: %v", err)
	}
	if err := ms.AcceptLink(userCtx, created.ID, link.Token, userID); err == nil {
		t.Fatalf("expected error on revoked link")
	}
}

func TestMemberships_InvitesAndList(t *testing.T) {
	a := testutil.NewTestApp(t)
	defer testutil.CloseTestApp(t, a)
	ms := NewMembershipService(a)
	as := NewAlbumsService(a)

	ownerID := testutil.MustCreateUser(t, a, "owner2@example.com")
	ctx := appctx.WithUserID(context.Background(), ownerID)
	created, err := as.Create(ctx, "Team2", "team2", string(album.VisibilityInviteOnly))
	if err != nil {
		t.Fatalf("album create: %v", err)
	}

	// Invite by email
	if err := ms.Invite(ctx, created.ID, "invited@example.com", "viewer", ownerID); err != nil {
		t.Fatalf("invite: %v", err)
	}

	// List should include pending invite (and no members/links yet)
	res, err := ms.List(ctx, created.ID)
	if err != nil {
		t.Fatalf("list: %v", err)
	}
	if len(res.Invites) == 0 {
		t.Fatalf("expected pending invites in list")
	}
}
