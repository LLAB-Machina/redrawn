package services

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"sort"
	"strings"
	"time"

	"redrawn/api/internal/api"
	"redrawn/api/internal/app"
	"redrawn/api/internal/errorsx"
	"redrawn/api/internal/generated"
	"redrawn/api/internal/generated/album"
	"redrawn/api/internal/generated/generatedphoto"
	"redrawn/api/internal/generated/originalphoto"

	"entgo.io/ent/dialect/sql"
)

type PhotosService struct{ app *app.App }

func NewPhotosService(a *app.App) *PhotosService { return &PhotosService{app: a} }

func (s *PhotosService) InitUpload(
	ctx context.Context,
	albumID, name, mime string,
	size int64,
) (api.UploadInitResponse, error) {
	// Prefer R2 (S3-compatible). Require minimal R2 config.
	if s.app.Config.R2AccessKeyID == "" || s.app.Config.R2SecretAccessKey == "" ||
		s.app.Config.R2Bucket == "" ||
		s.app.Config.R2S3Endpoint == "" {
		return api.UploadInitResponse{}, errors.New("R2 not configured")
	}

	fid := app.NewID()
	key := fid

	// Create DB row with provider=r2
	if _, err := s.app.Db.File.Create().
		SetID(fid).
		SetProvider("r2").
		SetProviderKey(key).
		SetOriginalName(name).
		SetMimeType(mime).
		SetSizeBytes(size).
		Save(ctx); err != nil {
		return api.UploadInitResponse{}, err
	}

	url, err := s.app.Storage.PresignPut(ctx, key, mime, 15*time.Minute)
	if err != nil {
		return api.UploadInitResponse{}, err
	}
	return api.UploadInitResponse{UploadURL: url, FileID: fid}, nil
}

func (s *PhotosService) CreateOriginal(
	ctx context.Context,
	albumID, fileID string,
) (api.IDResponse, error) {
	// Ensure request is authenticated so we can set the uploaded_by edge
	uid, ok := app.UserIDFromContext(ctx)
	if !ok {
		return api.IDResponse{}, errorsx.ErrUnauthorized
	}
	// Ensure file exists
	file, err := s.app.Db.File.Get(ctx, fileID)
	if err != nil {
		if generated.IsNotFound(err) {
			return api.IDResponse{}, errorsx.ErrNotFound
		}
		return api.IDResponse{}, err
	}

	// Create the OriginalPhoto record builder
	builder := s.app.Db.OriginalPhoto.Create().
		SetAlbumID(albumID).
		SetFileID(fileID).
		SetUploadedByID(uid)

	if strings.HasPrefix(file.MimeType, "image/") {
		metadata, err := s.extractImageMetadata(ctx, file)
		if err != nil {
			// TODO: Add proper logging here
		} else if metadata != nil {
			if metadata.CapturedAt != nil {
				builder = builder.SetCapturedAt(*metadata.CapturedAt)
			}
			if metadata.Latitude != nil {
				builder = builder.SetLatitude(*metadata.Latitude)
			}
			if metadata.Longitude != nil {
				builder = builder.SetLongitude(*metadata.Longitude)
			}
			if metadata.LocationName != nil {
				builder = builder.SetLocationName(*metadata.LocationName)
			}
			if metadata.ImageWidth != nil {
				builder = builder.SetImageWidth(*metadata.ImageWidth)
			}
			if metadata.ImageHeight != nil {
				builder = builder.SetImageHeight(*metadata.ImageHeight)
			}
			if metadata.Orientation != nil {
				builder = builder.SetOrientation(*metadata.Orientation)
			}
		}
	}

	o, err := builder.Save(ctx)
	if err != nil {
		return api.IDResponse{}, err
	}
	return api.IDResponse{ID: o.ID}, nil
}

func (s *PhotosService) ListOriginals(
	ctx context.Context,
	albumID string,
) ([]api.OriginalPhoto, error) {
	items, err := s.app.Db.OriginalPhoto.Query().
		Where(originalphoto.HasAlbumWith(album.IDEQ(albumID)), originalphoto.DeletedAtIsNil()).
		WithFile().
		WithGenerated(func(q *generated.GeneratedPhotoQuery) {
			q.Where(generatedphoto.DeletedAtIsNil()).
				WithFile().
				WithTheme()
		}).
		Order(
			originalphoto.ByCapturedAt(sql.OrderAsc()),
			originalphoto.ByCreatedAt(sql.OrderAsc()),
		).
		All(ctx)
	if err != nil {
		return nil, err
	}
	out := make([]api.OriginalPhoto, 0, len(items))
	for _, o := range items {
		op := api.OriginalPhoto{
			ID:           o.ID,
			CreatedAt:    o.CreatedAt,
			CapturedAt:   o.CapturedAt,
			Latitude:     o.Latitude,
			Longitude:    o.Longitude,
			LocationName: o.LocationName,
			ImageWidth:   o.ImageWidth,
			ImageHeight:  o.ImageHeight,
			Orientation:  o.Orientation,
		}
		if o.Edges.File != nil {
			op.FileID = o.Edges.File.ID
		}

		if o.Edges.Generated != nil {
			generated := make([]api.GeneratedPhoto, 0, len(o.Edges.Generated))
			processingCount := 0
			for _, g := range o.Edges.Generated {
				gp := api.GeneratedPhoto{
					ID:         g.ID,
					State:      string(g.Status),
					IsFavorite: g.IsFavorite,
					StartedAt:  g.StartedAt.Format(time.RFC3339),
				}
				if g.ErrorMessage != nil {
					gp.Error = *g.ErrorMessage
				}
				if g.Edges.File != nil {
					gp.FileID = g.Edges.File.ID
				}
				if g.Edges.Theme != nil {
					gp.ThemeID = g.Edges.Theme.ID
				}
				if g.Status == generatedphoto.StatusProcessing {
					processingCount++
				}
				generated = append(generated, gp)
			}
			sort.Slice(generated, func(i, j int) bool {
				return generated[i].StartedAt < generated[j].StartedAt
			})
			op.GeneratedPhotos = generated
			op.Processing = processingCount
		}

		out = append(out, op)
	}
	return out, nil
}

func (s *PhotosService) Generate(
	ctx context.Context,
	originalID, themeID string,
) (api.TaskResponse, error) {
	// Deduct one credit atomically and log usage
	uidStr, ok := app.UserIDFromContext(ctx)
	if !ok {
		return api.TaskResponse{}, errorsx.ErrUnauthorized
	}
	uid := uidStr
	// In a transaction: ensure user has credits, decrement, and create usage row
	tx, err := s.app.Db.Tx(ctx)
	if err != nil {
		return api.TaskResponse{}, err
	}
	defer func() { _ = tx.Rollback() }()
	u, err := tx.User.Get(ctx, uid)
	if err != nil {
		if generated.IsNotFound(err) {
			return api.TaskResponse{}, errorsx.ErrNotFound
		}
		return api.TaskResponse{}, err
	}
	if u.Credits <= 0 {
		return api.TaskResponse{}, errors.New("insufficient_credits")
	}
	if strings.TrimSpace(themeID) == "" {
		return api.TaskResponse{}, errors.New("theme_id_required")
	}
	// Create a processing GeneratedPhoto row first (still inside tx)
	gp, err := tx.GeneratedPhoto.Create().
		SetStartedAt(time.Now()).
		SetStatus(generatedphoto.StatusProcessing).
		SetOriginalPhotoID(originalID).
		SetThemeID(themeID).
		Save(ctx)
	if err != nil {
		return api.TaskResponse{}, err
	}
	// Decrement credits and log usage
	if err := tx.User.UpdateOneID(uid).AddCredits(-1).Exec(ctx); err != nil {
		return api.TaskResponse{}, err
	}
	if _, err := tx.CreditUsage.Create().
		SetUserID(uid).
		SetAmount(1).
		SetReason("generate").
		SetGeneratedPhotoID(gp.ID).
		Save(ctx); err != nil {
		return api.TaskResponse{}, err
	}
	if err := tx.Commit(); err != nil {
		return api.TaskResponse{}, err
	}

	if s.app.Queue == nil {
		return api.TaskResponse{}, errors.New("queue not configured")
	}

	// Enqueue background job with typed payload (River-backed queue)
	payload := api.GenerateJobPayload{
		Task:        "generate",
		OriginalID:  originalID,
		ThemeID:     themeID,
		GeneratedID: gp.ID,
	}
	jid, err := s.app.Queue.EnqueueGenerate(ctx, payload)
	if err != nil {
		// Keep DB and queue in sync: if enqueue fails, mark the pre-created row as failed
		_ = s.app.Db.GeneratedPhoto.UpdateOneID(gp.ID).
			SetStatus(generatedphoto.StatusFailed).
			SetErrorMessage(err.Error()).
			SetFinishedAt(time.Now()).
			Exec(ctx)
		return api.TaskResponse{}, err
	}
	return api.TaskResponse{TaskID: jid}, nil
}

func (s *PhotosService) ListGenerated(
	ctx context.Context,
	originalID string,
) ([]api.GeneratedPhoto, error) {
	items, err := s.app.Db.GeneratedPhoto.Query().
		Where(
			generatedphoto.HasOriginalPhotoWith(originalphoto.IDEQ(originalID)),
			generatedphoto.DeletedAtIsNil(),
		).
		WithFile().
		WithOriginalPhoto(func(q *generated.OriginalPhotoQuery) {
			q.Select(originalphoto.FieldDescription)
		}).
		WithTheme().
		All(ctx)
	if err != nil {
		return nil, err
	}
	out := make([]api.GeneratedPhoto, 0, len(items))
	for _, g := range items {
		gp := api.GeneratedPhoto{ID: g.ID, State: string(g.Status)}
		if g.ErrorMessage != nil {
			gp.Error = *g.ErrorMessage
		}
		if g.Edges.File != nil {
			gp.FileID = g.Edges.File.ID
		}
		if g.Edges.Theme != nil {
			gp.ThemeID = g.Edges.Theme.ID
		}
		out = append(out, gp)
	}
	return out, nil
}

func (s *PhotosService) FileURL(ctx context.Context, fileID string) (string, error) {
	f, err := s.app.Db.File.Get(ctx, fileID)
	if err != nil {
		if generated.IsNotFound(err) {
			return "", errorsx.ErrNotFound
		}
		return "", err
	}

	// If R2 configured, build a public URL or presigned GET
	if s.app.Config.R2Bucket != "" && f.ProviderKey != "" {
		if s.app.Config.R2PublicBaseURL != "" {
			return fmt.Sprintf("%s/%s", s.app.Config.R2PublicBaseURL, f.ProviderKey), nil
		}
		if s.app.Storage != nil {
			if url, err := s.app.Storage.PresignGet(ctx, f.ProviderKey, 15*time.Minute); err == nil &&
				url != "" {
				return url, nil
			}
		}
		return "", errors.New("R2 delivery not configured")
	}

	// No legacy image hosting fallback supported anymore
	return "", errors.New("delivery not configured")
}

func (s *PhotosService) MarkAsFavorite(
	ctx context.Context,
	originalID string,
	generatedID string,
) error {
	_, err := s.app.Db.GeneratedPhoto.Update().
		Where(generatedphoto.HasOriginalPhotoWith(originalphoto.IDEQ(originalID)), generatedphoto.DeletedAtIsNil()).
		SetIsFavorite(false).
		Save(ctx)
	if err != nil {
		return err
	}
	_, err = s.app.Db.GeneratedPhoto.UpdateOneID(generatedID).SetIsFavorite(true).Save(ctx)
	if err != nil {
		return err
	}
	return nil
}

func (s *PhotosService) extractImageMetadata(
	ctx context.Context,
	file *generated.File,
) (*PhotoMetadata, error) {
	if s.app.Storage == nil {
		return nil, errors.New("storage not configured")
	}

	data, _, err := s.app.Storage.Download(ctx, file.ProviderKey)
	if err != nil {
		return nil, fmt.Errorf("failed to download file: %w", err)
	}

	reader := bytes.NewReader(data)

	metadataService := NewMetadataService()
	metadata, err := metadataService.ExtractMetadata(ctx, reader)
	if err != nil {
		return nil, err
	}

	if metadata.CapturedAt == nil {
		metadata.CapturedAt = &file.CreatedAt
	}

	return metadata, nil
}
