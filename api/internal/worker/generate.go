package worker

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"mime/multipart"
	"net/http"
	"net/textproto"
	"os"
	"path/filepath"
	"strings"
	"time"

	"redrawn/api/ent"
	"redrawn/api/ent/generatedphoto"
	"redrawn/api/ent/originalphoto"
	"redrawn/api/ent/theme"
	"redrawn/api/internal/api"
	"redrawn/api/internal/app"
	"redrawn/api/internal/config"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

// NewGenerateProcessor returns the background job processor for image generation.
// It is a pure function that closes over config and DB client, then processes
// typed api.GenerateJobPayload values coming from the DB queue.
func NewGenerateProcessor(cfg config.Config, entClient *ent.Client) func(context.Context, api.GenerateJobPayload) error {
	// helper: mark failed
	markGeneratedFailed := func(ctx context.Context, gid string, msg string) error {
		_, err := entClient.GeneratedPhoto.UpdateOneID(gid).SetState(generatedphoto.StateFailed).SetErrorMsg(msg).SetFinishedAt(time.Now()).Save(ctx)
		return err
	}

	return func(ctx context.Context, payload api.GenerateJobPayload) error {
		jobID := payload.JobID
		// Write job logs under logs/jobs/<id>/logs.txt (relative to API working dir)
		// This resolves to api/logs/... when the server runs from the api/ directory.
		logDir := filepath.Join("logs", "jobs", jobID)
		_ = os.MkdirAll(logDir, 0o755)
		logPath := filepath.Join(logDir, "logs.txt")
		logf := func(format string, args ...any) {
			line := time.Now().Format(time.RFC3339) + " " + fmt.Sprintf(format, args...) + "\n"
			if f, err := os.OpenFile(logPath, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0o644); err == nil {
				_, _ = f.WriteString(line)
				_ = f.Close()
			}
			slog.Info("job", slog.String("id", jobID), slog.String("msg", fmt.Sprintf(format, args...)))
		}

		// IDs
		gidRaw := payload.GeneratedID
		oidRaw := payload.OriginalID
		tidRaw := payload.ThemeID
		if gidRaw == "" || oidRaw == "" {
			logf("missing ids in payload: %+v", payload)
			return fmt.Errorf("bad payload")
		}
		gid := gidRaw
		oid := oidRaw

		// Idempotency: if generated photo is already finalized, skip
		if gp, err := entClient.GeneratedPhoto.Get(ctx, gid); err == nil {
			if gp.State == generatedphoto.StateFinished || gp.State == generatedphoto.StateFailed {
				logf("generated %s already %s; skipping", gid, gp.State)
				return nil
			}
		}

		// Load original + theme
		o, err := entClient.OriginalPhoto.Query().Where(originalphoto.IDEQ(oid)).WithFile().Only(ctx)
		if err != nil {
			logf("load original failed: %v", err)
			_ = markGeneratedFailed(ctx, gid, fmt.Sprintf("load original: %v", err))
			return err
		}
		var themePrompt string
		if tidRaw != "" {
			if th, err := entClient.Theme.Query().Where(theme.IDEQ(tidRaw)).Only(ctx); err == nil {
				themePrompt = th.Prompt
			}
		}
		if o.Edges.File == nil || o.Edges.File.CloudflareID == "" {
			err := fmt.Errorf("original file missing key")
			logf(err.Error())
			_ = markGeneratedFailed(ctx, gid, err.Error())
			return err
		}

		// S3 client for R2
		awsCfg := aws.Config{Region: "auto", Credentials: aws.NewCredentialsCache(credentials.NewStaticCredentialsProvider(cfg.R2AccessKeyID, cfg.R2SecretAccessKey, ""))}
		s3c := s3.NewFromConfig(awsCfg, func(o *s3.Options) { o.UsePathStyle = true; o.BaseEndpoint = aws.String(cfg.R2S3Endpoint) })

		// Download original
		logf("downloading original from R2 key=%s", o.Edges.File.CloudflareID)
		gobj, err := s3c.GetObject(ctx, &s3.GetObjectInput{Bucket: aws.String(cfg.R2Bucket), Key: aws.String(o.Edges.File.CloudflareID)})
		if err != nil {
			logf("s3 get failed: %v", err)
			_ = markGeneratedFailed(ctx, gid, err.Error())
			return err
		}
		origBytes, _ := io.ReadAll(gobj.Body)
		_ = gobj.Body.Close()

		// OpenAI
		if cfg.OpenAIAPIKey == "" {
			err := fmt.Errorf("OPENAI_API_KEY not set")
			logf(err.Error())
			_ = markGeneratedFailed(ctx, gid, err.Error())
			return err
		}
		logf("calling OpenAI gpt-image-1 edits")
		var body bytes.Buffer
		mw := multipart.NewWriter(&body)

		_ = mw.WriteField("model", "gpt-image-1")
		_ = mw.WriteField("quality", "high")
		_ = mw.WriteField("size", "1024x1024")
		// how well we try to match input facial features etc, turn up later
		_ = mw.WriteField("input_fidelity", "high")

		promptToUse := themePrompt
		if strings.TrimSpace(promptToUse) == "" {
			promptToUse = "restyle image in current album theme"
		}
		_ = mw.WriteField("prompt", promptToUse)

		// Determine content type and filename for the image part
		contentType := ""
		if o.Edges.File != nil && o.Edges.File.Mime != "" {
			contentType = o.Edges.File.Mime
		}
		if contentType == "" && gobj.ContentType != nil {
			contentType = *gobj.ContentType
		}
		if contentType == "" {
			contentType = http.DetectContentType(origBytes)
		}
		// Allowed: image/jpeg, image/png, image/webp
		ext := "bin"
		switch contentType {
		case "image/jpeg":
			ext = "jpg"
		case "image/png":
			ext = "png"
		case "image/webp":
			ext = "webp"
		default:
			// Try to coerce to a supported type if detector returned a generic one
			if strings.Contains(contentType, "jpeg") {
				contentType = "image/jpeg"
				ext = "jpg"
			} else if strings.Contains(contentType, "png") {
				contentType = "image/png"
				ext = "png"
			} else if strings.Contains(contentType, "webp") {
				contentType = "image/webp"
				ext = "webp"
			} else {
				// Let OpenAI validate; but send as octet-stream would 400, so prefer jpeg as a fallback guess
				contentType = "image/jpeg"
				ext = "jpg"
			}
		}
		h := textproto.MIMEHeader{}
		h.Set("Content-Disposition", fmt.Sprintf(`form-data; name="image[]"; filename="%s"`, "original."+ext))
		h.Set("Content-Type", contentType)
		part, _ := mw.CreatePart(h)
		_, _ = part.Write(origBytes)
		_ = mw.Close()

		// Use a detached context with a generous timeout for the OpenAI edits request
		// to avoid premature cancellation from upstream worker contexts.
		oaiBaseCtx := context.WithoutCancel(ctx)
		oaiCtx, oaiCancel := context.WithTimeout(oaiBaseCtx, 5*time.Minute)
		defer oaiCancel()

		req, _ := http.NewRequestWithContext(oaiCtx, http.MethodPost, "https://api.openai.com/v1/images/edits", &body)
		req.Header.Set("Authorization", "Bearer "+cfg.OpenAIAPIKey)
		req.Header.Set("Content-Type", mw.FormDataContentType())

		httpClient := &http.Client{
			Timeout: 5 * time.Minute,
		}
		resp, err := httpClient.Do(req)
		if err != nil {
			logf("openai request failed: %v", err)
			_ = markGeneratedFailed(ctx, gid, err.Error())
			return err
		}
		defer func() { _ = resp.Body.Close() }()
		rb, _ := io.ReadAll(resp.Body)
		rid := resp.Header.Get("x-request-id")
		if rid == "" {
			rid = resp.Header.Get("openai-request-id")
		}
		logf("openai response status=%d request_id=%s body_prefix=%s", resp.StatusCode, rid, func() string {
			s := string(rb)
			if len(s) > 256 {
				return s[:256] + "..."
			}
			return s
		}())
		if resp.StatusCode < 200 || resp.StatusCode >= 300 {
			err := fmt.Errorf("openai status %d", resp.StatusCode)
			_ = markGeneratedFailed(ctx, gid, fmt.Sprintf("openai error: %s", string(rb)))
			return err
		}
		var oai struct {
			Data []struct {
				B64 string `json:"b64_json"`
			} `json:"data"`
		}
		if err := json.Unmarshal(rb, &oai); err != nil {
			logf("openai json unmarshal error: %v", err)
			_ = markGeneratedFailed(ctx, gid, fmt.Sprintf("unmarshal: %v", err))
			return err
		}
		if len(oai.Data) == 0 || oai.Data[0].B64 == "" {
			err := fmt.Errorf("openai response missing b64_json")
			_ = markGeneratedFailed(ctx, gid, err.Error())
			return err
		}
		imgBytes, err := base64.StdEncoding.DecodeString(oai.Data[0].B64)
		if err != nil {
			logf("b64 decode failed: %v", err)
			_ = markGeneratedFailed(ctx, gid, err.Error())
			return err
		}

		// File row (use detached, short DB timeout to avoid being impacted by upstream context deadline)
		newFileID := app.NewID()
		genKey := newFileID
		dbCtx1, cancelDB1 := context.WithTimeout(context.WithoutCancel(ctx), 30*time.Second)
		defer cancelDB1()
		if _, err := entClient.File.Create().
			SetID(newFileID).
			SetProvider("r2").
			SetCloudflareID(genKey).
			SetOriginalName("generated.png").
			SetMime("image/png").
			SetSizeBytes(int64(len(imgBytes))).
			Save(dbCtx1); err != nil {
			logf("create file row failed: %v", err)
			_ = markGeneratedFailed(ctx, gid, err.Error())
			return err
		}

		// Upload (use detached context with a reasonable timeout)
		logf("uploading generated to R2 key=%s", genKey)
		s3PutCtx, cancelPut := context.WithTimeout(context.WithoutCancel(ctx), 2*time.Minute)
		defer cancelPut()
		if _, err := s3c.PutObject(s3PutCtx, &s3.PutObjectInput{Bucket: aws.String(cfg.R2Bucket), Key: aws.String(genKey), Body: bytes.NewReader(imgBytes), ContentType: aws.String("image/png")}); err != nil {
			logf("s3 put failed: %v", err)
			_ = markGeneratedFailed(ctx, gid, err.Error())
			return err
		}

		// Update generated (detached DB context)
		dbCtx2, cancelDB2 := context.WithTimeout(context.WithoutCancel(ctx), 30*time.Second)
		defer cancelDB2()
		_, err = entClient.GeneratedPhoto.UpdateOneID(gid).
			SetState(generatedphoto.StateFinished).
			SetFinishedAt(time.Now()).
			SetFileID(newFileID).
			Save(dbCtx2)
		if err != nil {
			logf("update generated failed: %v", err)
			return err
		}
		logf("done")
		return nil
	}
}
