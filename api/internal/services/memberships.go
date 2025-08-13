package services

import (
    "context"

    "github.com/google/uuid"
    "redrawn/api/ent/album"
    "redrawn/api/ent/albumuser"
    "redrawn/api/ent/user"
    "redrawn/api/internal/app"
)

type MembershipService struct { app *app.App }

func NewMembershipService(a *app.App) *MembershipService { return &MembershipService{app: a} }

func (s *MembershipService) Invite(ctx context.Context, albumID, email, role string) error {
    u, err := s.app.Ent.User.Query().Where(user.EmailEQ(email)).Only(ctx)
    if err != nil { return err }
    aid, err := uuid.Parse(albumID)
    if err != nil { return err }
    return s.app.Ent.AlbumUser.Create().
        SetRole(albumuser.Role(role)).
        SetAlbumID(aid).
        SetUser(u).
        Exec(ctx)
}

func (s *MembershipService) SetRole(ctx context.Context, albumID, userID, role string) error {
    aid, err := uuid.Parse(albumID)
    if err != nil { return err }
    uid, err := uuid.Parse(userID)
    if err != nil { return err }
    au, err := s.app.Ent.AlbumUser.Query().
        Where(albumuser.HasAlbumWith(album.IDEQ(aid)), albumuser.HasUserWith(user.IDEQ(uid))).
        Only(ctx)
    if err != nil { return err }
    return s.app.Ent.AlbumUser.UpdateOne(au).SetRole(albumuser.Role(role)).Exec(ctx)
}

func (s *MembershipService) Remove(ctx context.Context, albumID, userID string) error {
    aid, err := uuid.Parse(albumID)
    if err != nil { return err }
    uid, err := uuid.Parse(userID)
    if err != nil { return err }
    _, err = s.app.Ent.AlbumUser.Delete().
        Where(albumuser.HasAlbumWith(album.IDEQ(aid)), albumuser.HasUserWith(user.IDEQ(uid))).
        Exec(ctx)
    return err
}

