package services

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"errors"
	"time"

	"redrawn/api/internal/api"
	"redrawn/api/internal/app"
	"redrawn/api/internal/generated/album"
	"redrawn/api/internal/generated/albuminvite"
	"redrawn/api/internal/generated/albuminvitelink"
	"redrawn/api/internal/generated/albumuser"
	"redrawn/api/internal/generated/user"
)

type MembershipService struct{ app *app.App }

func NewMembershipService(a *app.App) *MembershipService { return &MembershipService{app: a} }

// Invite by email creates a pending invite; acceptance is handled later
func (s *MembershipService) Invite(
	ctx context.Context,
	albumID, email, role, createdBy string,
) error {
	// Create a pending email invite (user may or may not exist yet)
	tok, err := generateToken()
	if err != nil {
		return err
	}
	_, err = s.app.Db.AlbumInvite.Create().
		SetEmail(email).
		SetRole(albuminvite.Role(role)).
		SetStatus(albuminvite.StatusPending).
		SetToken(tok).
		SetAlbumID(albumID).
		SetCreatedByID(createdBy).
		Save(ctx)
	return err
}

func (s *MembershipService) SetRole(ctx context.Context, albumID, userID, role string) error {
	au, err := s.app.Db.AlbumUser.Query().
		Where(albumuser.HasAlbumWith(album.IDEQ(albumID)), albumuser.HasUserWith(user.IDEQ(userID))).
		Only(ctx)
	if err != nil {
		return err
	}
	return s.app.Db.AlbumUser.UpdateOne(au).SetRole(albumuser.Role(role)).Exec(ctx)
}

func (s *MembershipService) Remove(ctx context.Context, albumID, userID string) error {
	_, err := s.app.Db.AlbumUser.Delete().
		Where(albumuser.HasAlbumWith(album.IDEQ(albumID)), albumuser.HasUserWith(user.IDEQ(userID))).
		Exec(ctx)
	return err
}

// Revoke a pending email invite
func (s *MembershipService) RevokeInvite(ctx context.Context, albumID, inviteID string) error {
	iv, err := s.app.Db.AlbumInvite.Query().
		Where(albuminvite.HasAlbumWith(album.IDEQ(albumID)), albuminvite.IDEQ(inviteID)).
		Only(ctx)
	if err != nil {
		return err
	}
	now := time.Now()
	return s.app.Db.AlbumInvite.UpdateOne(iv).
		SetStatus(albuminvite.StatusRevoked).
		SetRevokedAt(now).
		Exec(ctx)
}

// Update a pending invite's role
func (s *MembershipService) UpdateInviteRole(
	ctx context.Context,
	albumID, inviteID, role string,
) error {
	iv, err := s.app.Db.AlbumInvite.Query().
		Where(albuminvite.HasAlbumWith(album.IDEQ(albumID)), albuminvite.IDEQ(inviteID)).
		Only(ctx)
	if err != nil {
		return err
	}
	return s.app.Db.AlbumInvite.UpdateOne(iv).SetRole(albuminvite.Role(role)).Exec(ctx)
}

// List memberships, email invites, and invite links for an album
func (s *MembershipService) List(
	ctx context.Context,
	albumID string,
) (api.MembershipsResponse, error) {
	// Members
	aus, err := s.app.Db.AlbumUser.Query().
		Where(albumuser.HasAlbumWith(album.IDEQ(albumID))).
		WithUser().
		All(ctx)
	if err != nil {
		return api.MembershipsResponse{}, err
	}
	members := make([]api.AlbumMember, 0, len(aus))
	for _, au := range aus {
		if au.Edges.User == nil {
			continue
		}
		members = append(
			members,
			api.AlbumMember{
				UserID: au.Edges.User.ID,
				Email:  au.Edges.User.Email,
				Role:   string(au.Role),
			},
		)
	}

	// Pending email invites
	invs, err := s.app.Db.AlbumInvite.Query().
		Where(albuminvite.HasAlbumWith(album.IDEQ(albumID))).
		All(ctx)
	if err != nil {
		return api.MembershipsResponse{}, err
	}
	pending := make([]api.PendingInvite, 0, len(invs))
	for _, iv := range invs {
		var expStr *string
		if iv.ExpiresAt != nil {
			s := iv.ExpiresAt.Format(time.RFC3339)
			expStr = &s
		}
		pending = append(
			pending,
			api.PendingInvite{
				ID:        iv.ID,
				Email:     iv.Email,
				Role:      string(iv.Role),
				Status:    string(iv.Status),
				ExpiresAt: expStr,
			},
		)
	}

	// Invite links
	links, err := s.app.Db.AlbumInviteLink.Query().
		Where(albuminvitelink.HasAlbumWith(album.IDEQ(albumID))).
		All(ctx)
	if err != nil {
		return api.MembershipsResponse{}, err
	}
	outLinks := make([]api.InviteLink, 0, len(links))
	for _, l := range links {
		var maxUses *int
		var expStr *string
		var revStr *string
		if l.MaxUses != nil {
			v := *l.MaxUses
			maxUses = &v
		}
		if l.ExpiresAt != nil {
			s := l.ExpiresAt.Format(time.RFC3339)
			expStr = &s
		}
		if l.RevokedAt != nil {
			s := l.RevokedAt.Format(time.RFC3339)
			revStr = &s
		}
		outLinks = append(
			outLinks,
			api.InviteLink{
				ID:        l.ID,
				Token:     l.Token,
				Role:      string(l.Role),
				Uses:      l.Uses,
				MaxUses:   maxUses,
				ExpiresAt: expStr,
				RevokedAt: revStr,
			},
		)
	}

	return api.MembershipsResponse{Members: members, Invites: pending, Links: outLinks}, nil
}

// CreateLink creates a new role-based invite link
func (s *MembershipService) CreateLink(
	ctx context.Context,
	albumID string,
	req api.CreateInviteLinkRequest,
	createdBy string,
) (api.InviteLink, error) {
	tok, err := generateToken()
	if err != nil {
		return api.InviteLink{}, err
	}
	builder := s.app.Db.AlbumInviteLink.Create().
		SetToken(tok).
		SetRole(albuminvitelink.Role(req.Role)).
		SetAlbumID(albumID).
		SetCreatedByID(createdBy)
	if req.MaxUses != nil {
		builder = builder.SetMaxUses(*req.MaxUses)
	}
	if req.ExpiresAt != nil {
		if t, e := time.Parse(time.RFC3339, *req.ExpiresAt); e == nil {
			builder = builder.SetExpiresAt(t)
		}
	}
	l, err := builder.Save(ctx)
	if err != nil {
		return api.InviteLink{}, err
	}
	var maxUses *int
	if l.MaxUses != nil {
		v := *l.MaxUses
		maxUses = &v
	}
	var expStr *string
	if l.ExpiresAt != nil {
		s := l.ExpiresAt.Format(time.RFC3339)
		expStr = &s
	}
	return api.InviteLink{
		ID:        l.ID,
		Token:     l.Token,
		Role:      string(l.Role),
		Uses:      l.Uses,
		MaxUses:   maxUses,
		ExpiresAt: expStr,
	}, nil
}

func (s *MembershipService) RevokeLink(ctx context.Context, albumID, linkID string) error {
	l, err := s.app.Db.AlbumInviteLink.Query().
		Where(albuminvitelink.HasAlbumWith(album.IDEQ(albumID)), albuminvitelink.IDEQ(linkID)).
		Only(ctx)
	if err != nil {
		return err
	}
	now := time.Now()
	return s.app.Db.AlbumInviteLink.UpdateOne(l).SetRevokedAt(now).Exec(ctx)
}

// AcceptLink grants a membership via a link token for the current user
func (s *MembershipService) AcceptLink(ctx context.Context, albumID, token, userID string) error {
	l, err := s.app.Db.AlbumInviteLink.Query().
		Where(albuminvitelink.HasAlbumWith(album.IDEQ(albumID)), albuminvitelink.TokenEQ(token)).
		Only(ctx)
	if err != nil {
		return err
	}
	if l.RevokedAt != nil {
		return errors.New("link revoked")
	}
	if l.ExpiresAt != nil && time.Now().After(*l.ExpiresAt) {
		return errors.New("link expired")
	}
	if l.MaxUses != nil && l.Uses >= *l.MaxUses {
		return errors.New("link exhausted")
	}
	// Upsert membership
	au, err := s.app.Db.AlbumUser.Query().
		Where(albumuser.HasAlbumWith(album.IDEQ(albumID)), albumuser.HasUserWith(user.IDEQ(userID))).
		Only(ctx)
	if err == nil {
		if err := s.app.Db.AlbumUser.UpdateOne(au).SetRole(albumuser.Role(l.Role)).Exec(ctx); err != nil {
			return err
		}
	} else {
		if err := s.app.Db.AlbumUser.Create().SetAlbumID(albumID).SetUserID(userID).SetRole(albumuser.Role(l.Role)).Exec(ctx); err != nil {
			return err
		}
	}
	// increment uses
	if err := s.app.Db.AlbumInviteLink.UpdateOneID(l.ID).SetUses(l.Uses + 1).Exec(ctx); err != nil {
		return err
	}
	return nil
}

func generateToken() (string, error) {
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(b), nil
}
