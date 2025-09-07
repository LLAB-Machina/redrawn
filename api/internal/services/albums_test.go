package services

import (
	"context"
	"testing"

	api "redrawn/api/internal/api"
	appctx "redrawn/api/internal/app"
	"redrawn/api/internal/generated/album"
	"redrawn/api/internal/testutil"
)

func TestAlbumsCRUD(t *testing.T) {
	a := testutil.NewTestApp(t)
	defer testutil.CloseTestApp(t, a)
	svc := NewAlbumsService(a)

	// Seed user and set context
	uid := testutil.MustCreateUser(t, a, "owner@example.com")
	ctx := appctx.WithUserID(context.Background(), uid)

	// Create
	created, err := svc.Create(ctx, "My Album", "my-album", string(album.VisibilityPublic))
	if err != nil {
		t.Fatalf("Create: %v", err)
	}
	if created.ID == "" || created.Slug != "my-album" {
		t.Fatalf("unexpected created: %+v", created)
	}

	// List
	list, err := svc.List(ctx)
	if err != nil {
		t.Fatalf("List: %v", err)
	}
	if len(list) == 0 {
		t.Fatalf("expected at least one album")
	}

	// Get
	got, err := svc.Get(ctx, created.ID)
	if err != nil {
		t.Fatalf("Get: %v", err)
	}
	if got.Name != "My Album" {
		t.Fatalf("unexpected name: %s", got.Name)
	}

	// Update
	newName := "Renamed"
	if err := svc.Update(ctx, created.ID, api.AlbumUpdateRequest{Name: &newName}); err != nil {
		t.Fatalf("Update: %v", err)
	}
	got2, err := svc.Get(ctx, created.ID)
	if err != nil {
		t.Fatalf("Get after update: %v", err)
	}
	if got2.Name != newName {
		t.Fatalf("expected updated name, got %s", got2.Name)
	}

	// Delete (soft)
	if err := svc.Delete(ctx, created.ID); err != nil {
		t.Fatalf("Delete: %v", err)
	}
	if _, err := svc.Get(ctx, created.ID); err == nil {
		t.Fatalf("expected not found after soft delete")
	}
}

func TestAlbumsGet_NotFound(t *testing.T) {
	a := testutil.NewTestApp(t)
	defer testutil.CloseTestApp(t, a)
	svc := NewAlbumsService(a)
	if _, err := svc.Get(context.Background(), "does-not-exist"); err == nil {
		t.Fatalf("expected not found")
	}
}
