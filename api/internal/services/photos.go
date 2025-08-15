package services

import (
	"context"
	"errors"
	"fmt"
	"io"
	"net/http"
	"time"

	"redrawn/api/ent/album"
	"redrawn/api/ent/generatedphoto"
	"redrawn/api/ent/originalphoto"
	"redrawn/api/ent/theme"
	"redrawn/api/internal/api"
	"redrawn/api/internal/app"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/google/uuid"
)

type PhotosService struct{ app *app.App }

func NewPhotosService(a *app.App) *PhotosService { return &PhotosService{app: a} }

func (s *PhotosService) InitUpload(ctx context.Context, albumID, name, mime string, size int64) (api.UploadInitResponse, error) {
	// Prefer R2 (S3-compatible). Require minimal R2 config.
	if s.app.Config.R2AccessKeyID == "" || s.app.Config.R2SecretAccessKey == "" || s.app.Config.R2Bucket == "" || s.app.Config.R2S3Endpoint == "" {
		return api.UploadInitResponse{}, errors.New("R2 not configured")
	}

	fid := uuid.New()
	key := fid.String()

	// Create DB row with provider=r2
	if _, err := s.app.Ent.File.Create().
		SetID(fid).
		SetProvider("r2").
		SetCloudflareID(key).
		SetOriginalName(name).
		SetMime(mime).
		SetSizeBytes(size).
		Save(ctx); err != nil {
		return api.UploadInitResponse{}, err
	}

	// Build S3 client and presigner
	awsCfg := aws.Config{
		Region: "auto",
		Credentials: aws.NewCredentialsCache(credentials.NewStaticCredentialsProvider(
			s.app.Config.R2AccessKeyID,
			s.app.Config.R2SecretAccessKey,
			"",
		)),
	}
	s3c := s3.NewFromConfig(awsCfg, func(o *s3.Options) {
		o.UsePathStyle = true
		o.BaseEndpoint = aws.String(s.app.Config.R2S3Endpoint)
	})
	presigner := s3.NewPresignClient(s3c)

	pre, err := presigner.PresignPutObject(ctx, &s3.PutObjectInput{
		Bucket:      aws.String(s.app.Config.R2Bucket),
		Key:         aws.String(key),
		ContentType: aws.String(mime),
	}, func(opts *s3.PresignOptions) { opts.Expires = 15 * time.Minute })
	if err != nil {
		return api.UploadInitResponse{}, err
	}
	return api.UploadInitResponse{UploadURL: pre.URL, FileID: fid.String()}, nil
}

func (s *PhotosService) CreateOriginal(ctx context.Context, albumID, fileID string) (api.IDResponse, error) {
	// Ensure request is authenticated so we can set the uploaded_by edge
	uid, ok := app.UserIDFromContext(ctx)
	if !ok {
		return api.IDResponse{}, errors.New("unauthorized")
	}
	uploaderID, err := uuid.Parse(uid)
	if err != nil {
		return api.IDResponse{}, err
	}
	aid, err := uuid.Parse(albumID)
	if err != nil {
		return api.IDResponse{}, err
	}
	fid, err := uuid.Parse(fileID)
	if err != nil {
		return api.IDResponse{}, err
	}
	// Ensure file exists
	if _, err := s.app.Ent.File.Get(ctx, fid); err != nil {
		return api.IDResponse{}, err
	}
	o, err := s.app.Ent.OriginalPhoto.Create().
		SetID(uuid.New()).
		SetAlbumID(aid).
		SetFileID(fid).
		SetUploadedByID(uploaderID).
		Save(ctx)
	if err != nil {
		return api.IDResponse{}, err
	}
	return api.IDResponse{ID: o.ID.String()}, nil
}

func (s *PhotosService) ListOriginals(ctx context.Context, albumID string) ([]api.OriginalPhoto, error) {
	aid, err := uuid.Parse(albumID)
	if err != nil {
		return nil, err
	}
	items, err := s.app.Ent.OriginalPhoto.Query().
		Where(originalphoto.HasAlbumWith(album.IDEQ(aid))).
		WithFile().
		All(ctx)
	if err != nil {
		return nil, err
	}
	out := make([]api.OriginalPhoto, 0, len(items))
	for _, o := range items {
		op := api.OriginalPhoto{ID: o.ID.String(), CreatedAt: o.CreatedAt}
		if o.Edges.File != nil {
			op.FileID = o.Edges.File.ID.String()
		}
		// Count how many generated photos are currently processing for this original
		if n, err := s.app.Ent.GeneratedPhoto.Query().
			Where(
				generatedphoto.HasOriginalPhotoWith(originalphoto.IDEQ(o.ID)),
				generatedphoto.StateEQ(generatedphoto.StateProcessing),
			).
			Count(ctx); err == nil {
			op.Processing = n
		}
		out = append(out, op)
	}
	return out, nil
}

func (s *PhotosService) Generate(ctx context.Context, originalID, themeID string) (api.TaskResponse, error) {
	// Deduct one credit atomically and log usage
	uidStr, ok := app.UserIDFromContext(ctx)
	if !ok {
		return api.TaskResponse{}, errors.New("unauthorized")
	}
	uid, err := uuid.Parse(uidStr)
	if err != nil {
		return api.TaskResponse{}, err
	}
	// In a transaction: ensure user has credits, decrement, and create usage row
	tx, err := s.app.Ent.Tx(ctx)
	if err != nil {
		return api.TaskResponse{}, err
	}
	defer func() { _ = tx.Rollback() }()
	u, err := tx.User.Get(ctx, uid)
	if err != nil {
		return api.TaskResponse{}, err
	}
	if u.Credits <= 0 {
		return api.TaskResponse{}, errors.New("insufficient_credits")
	}
	// prepare associations we'll fill after gp create
	var themeUUID *uuid.UUID
	if themeID != "" {
		if tid, err := uuid.Parse(themeID); err == nil {
			themeUUID = &tid
		}
	}
	// Create a processing GeneratedPhoto row first (still inside tx)
	oid, err := uuid.Parse(originalID)
	if err != nil {
		return api.TaskResponse{}, err
	}
	gp, err := tx.GeneratedPhoto.Create().
		SetID(uuid.New()).
		SetStartedAt(time.Now()).
		SetState(generatedphoto.StateProcessing).
		SetOriginalPhotoID(oid).
		Save(ctx)
	if err != nil {
		return api.TaskResponse{}, err
	}
	if themeUUID != nil {
		if _, err := tx.GeneratedPhoto.UpdateOneID(gp.ID).SetThemeID(*themeUUID).Save(ctx); err != nil {
			return api.TaskResponse{}, err
		}
	}
	// Decrement credits and log usage
	if err := tx.User.UpdateOneID(uid).AddCredits(-1).Exec(ctx); err != nil {
		return api.TaskResponse{}, err
	}
	if _, err := tx.CreditUsage.Create().
		SetID(uuid.New()).
		SetUserID(uid).
		SetAmount(1).
		SetReason("generate").
		SetGeneratedPhotoID(gp.ID).
		SetOriginalPhotoID(oid).
		Save(ctx); err != nil {
		return api.TaskResponse{}, err
	}
	if err := tx.Commit(); err != nil {
		return api.TaskResponse{}, err
	}

	if s.app.Queue == nil {
		// Fallback: synchronous generation
		if s.app.Config.OpenAIAPIKey == "" {
			return api.TaskResponse{TaskID: ""}, nil
		}
		// Fetch original file metadata
		oid, err := uuid.Parse(originalID)
		if err != nil {
			return api.TaskResponse{}, err
		}
		o, err := s.app.Ent.OriginalPhoto.Query().Where(originalphoto.IDEQ(oid)).WithFile().Only(ctx)
		if err != nil {
			return api.TaskResponse{}, err
		}
		if o.Edges.File == nil || o.Edges.File.CloudflareID == "" {
			return api.TaskResponse{}, errors.New("original file not ready")
		}
		// Call OpenAI Images (placeholder URL to demonstrate request shape)
		req, _ := http.NewRequestWithContext(ctx, http.MethodPost, "https://api.openai.com/v1/images/edits", nil)
		req.Header.Set("Authorization", "Bearer "+s.app.Config.OpenAIAPIKey)
		resp, err := http.DefaultClient.Do(req)
		if err != nil {
			return api.TaskResponse{}, err
		}
		defer func() { _ = resp.Body.Close() }()
		_, _ = io.ReadAll(resp.Body)
		// Create generated photo record in finished state without actual upload
		gen := s.app.Ent.GeneratedPhoto.Create().
			SetID(uuid.New()).
			SetStartedAt(time.Now()).
			SetState(generatedphoto.StateFinished).
			SetOriginalPhotoID(o.ID)
		if tid, err := uuid.Parse(themeID); err == nil {
			gen = gen.SetThemeID(tid)
		}
		g, err := gen.Save(ctx)
		if err != nil {
			return api.TaskResponse{}, err
		}
		return api.TaskResponse{TaskID: g.ID.String()}, nil
	}

	// Async path with queue: prevent duplicate pending jobs for same (original, theme).
	oid, err = uuid.Parse(originalID)
	if err != nil {
		return api.TaskResponse{}, err
	}
	var tidPtr *uuid.UUID
	if themeID != "" {
		if tid, err := uuid.Parse(themeID); err == nil {
			tidPtr = &tid
		}
	}

	// Check if a generation is already processing for this pair
	q := s.app.Ent.GeneratedPhoto.Query().
		Where(generatedphoto.HasOriginalPhotoWith(originalphoto.IDEQ(oid)), generatedphoto.StateEQ(generatedphoto.StateProcessing))
	if tidPtr != nil {
		q = q.Where(generatedphoto.HasThemeWith(theme.IDEQ(*tidPtr)))
	}
	if existing, err := q.First(ctx); err == nil && existing != nil {
		return api.TaskResponse{TaskID: existing.ID.String()}, nil
	}

	// Create a processing GeneratedPhoto row to represent the pending work
	create := s.app.Ent.GeneratedPhoto.Create().
		SetID(uuid.New()).
		SetStartedAt(time.Now()).
		SetState(generatedphoto.StateProcessing).
		SetOriginalPhotoID(oid)
	if tidPtr != nil {
		create = create.SetThemeID(*tidPtr)
	}
	gp2, err := create.Save(ctx)
	if err != nil {
		return api.TaskResponse{}, err
	}

	// Enqueue background job with typed payload (River-backed queue)
	payload := api.GenerateJobPayload{Task: "generate", OriginalID: originalID, ThemeID: themeID, GeneratedID: gp2.ID.String()}
	jid, err := s.app.Queue.EnqueueGenerate(ctx, payload)
	if err != nil {
		// Keep DB and queue in sync: if enqueue fails, mark the pre-created row as failed
		_ = s.app.Ent.GeneratedPhoto.UpdateOneID(gp2.ID).
			SetState(generatedphoto.StateFailed).
			SetErrorMsg(err.Error()).
			SetFinishedAt(time.Now()).
			Exec(ctx)
		return api.TaskResponse{}, err
	}
	return api.TaskResponse{TaskID: jid}, nil
}

func (s *PhotosService) ListGenerated(ctx context.Context, originalID string) ([]api.GeneratedPhoto, error) {
	oid, err := uuid.Parse(originalID)
	if err != nil {
		return nil, err
	}
	items, err := s.app.Ent.GeneratedPhoto.Query().
		Where(generatedphoto.HasOriginalPhotoWith(originalphoto.IDEQ(oid))).
		WithFile().
		WithTheme().
		All(ctx)
	if err != nil {
		return nil, err
	}
	out := make([]api.GeneratedPhoto, 0, len(items))
	for _, g := range items {
		gp := api.GeneratedPhoto{ID: g.ID.String(), State: string(g.State)}
		if g.ErrorMsg != nil {
			gp.Error = *g.ErrorMsg
		}
		if g.Edges.File != nil {
			gp.FileID = g.Edges.File.ID.String()
		}
		if g.Edges.Theme != nil {
			gp.ThemeID = g.Edges.Theme.ID.String()
		}
		out = append(out, gp)
	}
	return out, nil
}

func (s *PhotosService) FileURL(ctx context.Context, fileID string) (string, error) {
	fid, err := uuid.Parse(fileID)
	if err != nil {
		return "", err
	}
	f, err := s.app.Ent.File.Get(ctx, fid)
	if err != nil {
		return "", err
	}

	// If R2 configured, build a public URL or presigned GET
	if s.app.Config.R2Bucket != "" && f.CloudflareID != "" {
		if s.app.Config.R2PublicBaseURL != "" {
			return fmt.Sprintf("%s/%s", s.app.Config.R2PublicBaseURL, f.CloudflareID), nil
		}
		if s.app.Config.R2AccessKeyID == "" || s.app.Config.R2SecretAccessKey == "" || s.app.Config.R2S3Endpoint == "" {
			return "", errors.New("R2 delivery not configured")
		}
		awsCfg := aws.Config{
			Region: "auto",
			Credentials: aws.NewCredentialsCache(credentials.NewStaticCredentialsProvider(
				s.app.Config.R2AccessKeyID,
				s.app.Config.R2SecretAccessKey,
				"",
			)),
		}
		s3c := s3.NewFromConfig(awsCfg, func(o *s3.Options) {
			o.UsePathStyle = true
			o.BaseEndpoint = aws.String(s.app.Config.R2S3Endpoint)
		})
		presigner := s3.NewPresignClient(s3c)
		pre, err := presigner.PresignGetObject(ctx, &s3.GetObjectInput{
			Bucket: aws.String(s.app.Config.R2Bucket),
			Key:    aws.String(f.CloudflareID),
		}, func(opts *s3.PresignOptions) { opts.Expires = 15 * time.Minute })
		if err != nil {
			return "", err
		}
		return pre.URL, nil
	}

	// No legacy image hosting fallback supported anymore
	return "", errors.New("delivery not configured")
}
