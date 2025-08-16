package openai

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"net/textproto"
	"strings"
	"time"

	"redrawn/api/internal/config"
)

// Client defines the minimal OpenAI operations used by the app.
type Client interface {
	// EditImage performs an image edit using OpenAI and returns the generated image bytes (PNG) and the request ID.
	EditImage(
		ctx context.Context,
		prompt string,
		imageBytes []byte,
		imageContentType string,
	) (resultPNG []byte, requestID string, err error)
}

type httpClient struct {
	apiKey string
	http   *http.Client
}

// NewFromConfig constructs a new OpenAI client from app config.
func NewFromConfig(cfg config.Config) Client {
	return &httpClient{
		apiKey: strings.TrimSpace(cfg.OpenAIAPIKey),
		http:   &http.Client{Timeout: 5 * time.Minute},
	}
}

func (c *httpClient) EditImage(
	ctx context.Context,
	prompt string,
	imageBytes []byte,
	imageContentType string,
) ([]byte, string, error) {
	if c.apiKey == "" {
		return nil, "", fmt.Errorf("OPENAI_API_KEY not set")
	}

	var body bytes.Buffer
	mw := multipart.NewWriter(&body)
	_ = mw.WriteField("model", "gpt-image-1")
	_ = mw.WriteField("quality", "high")
	_ = mw.WriteField("size", "1024x1024")
	_ = mw.WriteField("input_fidelity", "high")
	_ = mw.WriteField("prompt", prompt)

	// Attach image part; infer a filename extension from content type for best compatibility
	var ext string
	switch imageContentType {
	case "image/png":
		ext = "png"
	case "image/webp":
		ext = "webp"
	default:
		if strings.Contains(imageContentType, "png") {
			ext = "png"
			imageContentType = "image/png"
		} else if strings.Contains(imageContentType, "webp") {
			ext = "webp"
			imageContentType = "image/webp"
		} else {
			imageContentType = "image/jpeg"
			ext = "jpg"
		}
	}

	h := textproto.MIMEHeader{}
	h.Set(
		"Content-Disposition",
		fmt.Sprintf(`form-data; name="image[]"; filename="%s"`, "original."+ext),
	)
	h.Set("Content-Type", imageContentType)
	part, _ := mw.CreatePart(h)
	_, _ = part.Write(imageBytes)
	_ = mw.Close()

	// Respect caller's context, but ensure there's a generous timeout if none is present
	if _, hasDeadline := ctx.Deadline(); !hasDeadline {
		var cancel context.CancelFunc
		ctx, cancel = context.WithTimeout(ctx, 5*time.Minute)
		defer cancel()
	}

	req, _ := http.NewRequestWithContext(
		ctx,
		http.MethodPost,
		"https://api.openai.com/v1/images/edits",
		&body,
	)
	req.Header.Set("Authorization", "Bearer "+c.apiKey)
	req.Header.Set("Content-Type", mw.FormDataContentType())

	resp, err := c.http.Do(req)
	if err != nil {
		return nil, "", err
	}
	defer func() { _ = resp.Body.Close() }()

	rb, _ := io.ReadAll(resp.Body)
	reqID := resp.Header.Get("x-request-id")
	if reqID == "" {
		reqID = resp.Header.Get("openai-request-id")
	}
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return nil, reqID, fmt.Errorf("openai status %d: %s", resp.StatusCode, string(rb))
	}
	var oai struct {
		Data []struct {
			B64 string `json:"b64_json"`
		} `json:"data"`
	}
	if err := json.Unmarshal(rb, &oai); err != nil {
		return nil, reqID, err
	}
	if len(oai.Data) == 0 || oai.Data[0].B64 == "" {
		return nil, reqID, fmt.Errorf("openai response missing b64_json")
	}
	imgBytes, err := base64.StdEncoding.DecodeString(oai.Data[0].B64)
	if err != nil {
		return nil, reqID, err
	}
	return imgBytes, reqID, nil
}
