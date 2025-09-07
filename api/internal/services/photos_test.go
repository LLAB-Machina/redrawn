package services

import (
	"context"
	"testing"

	appctx "redrawn/api/internal/app"
	"redrawn/api/internal/testutil"
)

func TestPhotosInitUpload_ReturnsURLAndPersistsFile(t *testing.T) {
	a := testutil.NewTestApp(t)
	defer testutil.CloseTestApp(t, a)
	svc := NewPhotosService(a)

	res, err := svc.InitUpload(context.Background(), "alb_123", "photo.jpg", "image/jpeg", 12345)
	if err != nil {
		t.Fatalf("InitUpload: %v", err)
	}
	if res.UploadURL == "" || res.FileID == "" {
		t.Fatalf("expected upload url and file id, got: %+v", res)
	}
	// ensure file persisted
	if _, err := a.Db.File.Get(context.Background(), res.FileID); err != nil {
		t.Fatalf("file not persisted: %v", err)
	}
}

func TestPhotosCreateOriginal_Unauthorized(t *testing.T) {
	a := testutil.NewTestApp(t)
	defer testutil.CloseTestApp(t, a)
	svc := NewPhotosService(a)

	_, err := svc.CreateOriginal(context.Background(), "alb_1", "file_1")
	if err == nil {
		t.Fatalf("expected unauthorized error")
	}
}

func TestPhotosCreateOriginal_Success(t *testing.T) {
	a := testutil.NewTestApp(t)
	defer testutil.CloseTestApp(t, a)
	svc := NewPhotosService(a)

	// create user and put into context
	uid := testutil.MustCreateUser(t, a, "u@example.com")
	ctx := appctx.WithUserID(context.Background(), uid)
	// create a file row required by CreateOriginal
	f, err := a.Db.File.Create().SetProvider("r2").SetProviderKey("k").SetOriginalName("n").SetMimeType("image/jpeg").SetSizeBytes(1).Save(ctx)
	if err != nil {
		t.Fatalf("seed file: %v", err)
	}
	out, err := svc.CreateOriginal(ctx, "alb_x", f.ID)
	if err != nil {
		t.Fatalf("CreateOriginal: %v", err)
	}
	if out.ID == "" {
		t.Fatalf("expected id in response")
	}
}

func TestPhotosFileURL_PublicBase(t *testing.T) {
	a := testutil.NewTestApp(t)
	defer testutil.CloseTestApp(t, a)
	svc := NewPhotosService(a)

	// create a file row
	f, err := a.Db.File.Create().SetProvider("r2").SetProviderKey("folder/key.jpg").SetOriginalName("n").SetMimeType("image/jpeg").SetSizeBytes(1).Save(context.Background())
	if err != nil {
		t.Fatalf("seed file: %v", err)
	}
	url, err := svc.FileURL(context.Background(), f.ID)
	if err != nil {
		t.Fatalf("FileURL: %v", err)
	}
	if url == "" {
		t.Fatalf("expected non-empty url")
	}
}
