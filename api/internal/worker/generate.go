package worker

import (
	"context"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"redrawn/api/internal/api"
	"redrawn/api/internal/app"
	"redrawn/api/internal/clients/openai"
	"redrawn/api/internal/clients/storage"
	"redrawn/api/internal/generated"
	"redrawn/api/internal/generated/generatedphoto"
	"redrawn/api/internal/generated/originalphoto"
	"redrawn/api/internal/generated/theme"
)

// NewGenerateProcessor returns the background job processor for image generation.
// It is a pure function that closes over dependencies, then processes
// typed api.GenerateJobPayload values coming from the DB queue.
func NewGenerateProcessor(
	dbClient *generated.Client,
	oai openai.Client,
	store storage.Client,
) func(context.Context, api.GenerateJobPayload) error {
	// helper: mark failed
	markGeneratedFailed := func(ctx context.Context, gid string, msg string) error {
		_, err := dbClient.GeneratedPhoto.UpdateOneID(gid).
			SetStatus(generatedphoto.StatusFailed).
			SetErrorMessage(msg).
			SetFinishedAt(time.Now()).
			Save(ctx)
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
			slog.Info(
				"job",
				slog.String("id", jobID),
				slog.String("msg", fmt.Sprintf(format, args...)),
			)
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
		if gp, err := dbClient.GeneratedPhoto.Get(ctx, gid); err == nil {
			if gp.Status == generatedphoto.StatusFinished ||
				gp.Status == generatedphoto.StatusFailed {
				logf("generated %s already %s; skipping", gid, gp.Status)
				return nil
			}
		}

		// Load original + theme
		o, err := dbClient.OriginalPhoto.Query().Where(originalphoto.IDEQ(oid)).WithFile().Only(ctx)
		if err != nil {
			logf("load original failed: %v", err)
			_ = markGeneratedFailed(ctx, gid, fmt.Sprintf("load original: %v", err))
			return err
		}
		var themePrompt string
		if tidRaw != "" {
			if th, err := dbClient.Theme.Query().Where(theme.IDEQ(tidRaw)).Only(ctx); err == nil {
				themePrompt = th.Prompt
			}
		}
		if o.Edges.File == nil || o.Edges.File.ProviderKey == "" {
			err := fmt.Errorf("original file missing key")
			logf(err.Error())
			_ = markGeneratedFailed(ctx, gid, err.Error())
			return err
		}

		// Download original from storage
		logf("downloading original from storage key=%s", o.Edges.File.ProviderKey)
		origBytes, contentType, err := store.Download(ctx, o.Edges.File.ProviderKey)
		if err != nil {
			logf("storage download failed: %v", err)
			_ = markGeneratedFailed(ctx, gid, err.Error())
			return err
		}
		if contentType == "" {
			contentType = http.DetectContentType(origBytes)
		}

		// OpenAI
		promptToUse := themePrompt
		if strings.TrimSpace(promptToUse) == "" {
			promptToUse = "restyle image in current album theme"
		}
		logf("calling OpenAI gpt-image-1 edits")
		// Use detached context with generous timeout to avoid premature cancellation
		oaiBaseCtx := context.WithoutCancel(ctx)
		oaiCtx, oaiCancel := context.WithTimeout(oaiBaseCtx, 5*time.Minute)
		defer oaiCancel()

		imgBytes, reqID, err := oai.EditImage(oaiCtx, promptToUse, origBytes, contentType)
		if err != nil {
			logf("openai request failed: %v", err)
			_ = markGeneratedFailed(ctx, gid, err.Error())
			return err
		}
		logf("openai response ok request_id=%s size=%d", reqID, len(imgBytes))

		// File row (use detached, short DB timeout to avoid being impacted by upstream context deadline)
		newFileID := app.NewID()
		genKey := newFileID
		dbCtx1, cancelDB1 := context.WithTimeout(context.WithoutCancel(ctx), 30*time.Second)
		defer cancelDB1()
		if _, err := dbClient.File.Create().
			SetID(newFileID).
			SetProvider("r2").
			SetProviderKey(genKey).
			SetOriginalName("generated.png").
			SetMimeType("image/png").
			SetSizeBytes(int64(len(imgBytes))).
			Save(dbCtx1); err != nil {
			logf("create file row failed: %v", err)
			_ = markGeneratedFailed(ctx, gid, err.Error())
			return err
		}

		// Upload (use detached context with a reasonable timeout)
		logf("uploading generated to storage key=%s", genKey)
		s3PutCtx, cancelPut := context.WithTimeout(context.WithoutCancel(ctx), 2*time.Minute)
		defer cancelPut()
		if err := store.Upload(s3PutCtx, genKey, imgBytes, "image/png"); err != nil {
			logf("storage upload failed: %v", err)
			_ = markGeneratedFailed(ctx, gid, err.Error())
			return err
		}

		// Update generated (detached DB context)
		dbCtx2, cancelDB2 := context.WithTimeout(context.WithoutCancel(ctx), 30*time.Second)
		defer cancelDB2()
		_, err = dbClient.GeneratedPhoto.UpdateOneID(gid).
			SetStatus(generatedphoto.StatusFinished).
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
