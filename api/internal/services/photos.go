package services

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"io"
	"net/http"
	"time"

	"redrawn/api/ent/album"
	"redrawn/api/ent/generatedphoto"
	"redrawn/api/ent/originalphoto"
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

	// Create DB row with provider=r2 and key stored in CloudflareID field
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
		out = append(out, op)
	}
	return out, nil
}

func (s *PhotosService) Generate(ctx context.Context, originalID, themeID string) (api.TaskResponse, error) {
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
		defer resp.Body.Close()
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
	payload := map[string]any{"original_id": originalID, "theme_id": themeID}
	id, err := s.app.Queue.Enqueue(ctx, "generate", payload)
	if err != nil {
		return api.TaskResponse{}, err
	}
	return api.TaskResponse{TaskID: id}, nil
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

	// Fallback: Cloudflare Images
	if s.app.Config.CFImagesDeliveryHash != "" && f.CloudflareID != "" {
		base := fmt.Sprintf("https://imagedelivery.net/%s/%s/public", s.app.Config.CFImagesDeliveryHash, f.CloudflareID)
		sig := signURL(base, s.app.Config.CFImagesToken)
		return base + "?sig=" + sig, nil
	}
	return "", errors.New("delivery not configured")
}

func signURL(u, secret string) string {
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write([]byte(u))
	return hex.EncodeToString(mac.Sum(nil))
}
