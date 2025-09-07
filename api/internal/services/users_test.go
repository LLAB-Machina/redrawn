package services

import (
	"context"
	"testing"

	appctx "redrawn/api/internal/app"
	"redrawn/api/internal/testutil"
)

func TestUsersPatchMe_Unauthorized(t *testing.T) {
	a := testutil.NewTestApp(t)
	defer testutil.CloseTestApp(t, a)
	svc := NewUsersService(a)
	if err := svc.PatchMe(context.Background(), strPtr("Ani")); err == nil {
		t.Fatalf("expected unauthorized error")
	}
}

func TestUsersPatchMe_SetsName(t *testing.T) {
	a := testutil.NewTestApp(t)
	defer testutil.CloseTestApp(t, a)
	svc := NewUsersService(a)
	uid := testutil.MustCreateUser(t, a, "patch@example.com")
	ctx := appctx.WithUserID(context.Background(), uid)
	name := "Ani"
	if err := svc.PatchMe(ctx, &name); err != nil {
		t.Fatalf("PatchMe: %v", err)
	}
	u, err := a.Db.User.Get(ctx, uid)
	if err != nil {
		t.Fatalf("get user: %v", err)
	}
	if u.Name != name {
		t.Fatalf("expected name %q, got %q", name, u.Name)
	}
}

func strPtr(s string) *string { return &s }
