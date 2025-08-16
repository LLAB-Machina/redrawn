package storage

import (
	"bytes"
	"context"
	"io"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"

	"redrawn/api/internal/config"
)

// Client defines the minimal object storage operations used by the app.
type Client interface {
	Download(ctx context.Context, key string) (data []byte, contentType string, err error)
	Upload(ctx context.Context, key string, data []byte, contentType string) error
	// PresignPut returns a pre-signed URL for uploading an object with the given key and content type.
	PresignPut(
		ctx context.Context,
		key string,
		contentType string,
		expires time.Duration,
	) (string, error)
	// PresignGet returns a pre-signed URL for downloading an object with the given key.
	PresignGet(ctx context.Context, key string, expires time.Duration) (string, error)
}

type r2Client struct {
	s3     *s3.Client
	bucket string
}

// NewR2FromConfig constructs an R2-backed storage client.
func NewR2FromConfig(cfg config.Config) Client {
	awsCfg := aws.Config{
		Region: "auto",
		Credentials: aws.NewCredentialsCache(
			credentials.NewStaticCredentialsProvider(cfg.R2AccessKeyID, cfg.R2SecretAccessKey, ""),
		),
	}
	s3c := s3.NewFromConfig(
		awsCfg,
		func(o *s3.Options) { o.UsePathStyle = true; o.BaseEndpoint = aws.String(cfg.R2S3Endpoint) },
	)
	return &r2Client{s3: s3c, bucket: cfg.R2Bucket}
}

func (c *r2Client) Download(ctx context.Context, key string) ([]byte, string, error) {
	obj, err := c.s3.GetObject(
		ctx,
		&s3.GetObjectInput{Bucket: aws.String(c.bucket), Key: aws.String(key)},
	)
	if err != nil {
		return nil, "", err
	}
	defer func() { _ = obj.Body.Close() }()
	b, err := io.ReadAll(obj.Body)
	if err != nil {
		return nil, "", err
	}
	ct := ""
	if obj.ContentType != nil {
		ct = *obj.ContentType
	}
	return b, ct, nil
}

func (c *r2Client) Upload(ctx context.Context, key string, data []byte, contentType string) error {
	_, err := c.s3.PutObject(
		ctx,
		&s3.PutObjectInput{
			Bucket:      aws.String(c.bucket),
			Key:         aws.String(key),
			Body:        bytes.NewReader(data),
			ContentType: aws.String(contentType),
		},
	)
	return err
}

func (c *r2Client) PresignPut(
	ctx context.Context,
	key string,
	contentType string,
	expires time.Duration,
) (string, error) {
	presigner := s3.NewPresignClient(c.s3)
	pre, err := presigner.PresignPutObject(ctx, &s3.PutObjectInput{
		Bucket:      aws.String(c.bucket),
		Key:         aws.String(key),
		ContentType: aws.String(contentType),
	}, func(opts *s3.PresignOptions) { opts.Expires = expires })
	if err != nil {
		return "", err
	}
	return pre.URL, nil
}

func (c *r2Client) PresignGet(
	ctx context.Context,
	key string,
	expires time.Duration,
) (string, error) {
	presigner := s3.NewPresignClient(c.s3)
	pre, err := presigner.PresignGetObject(ctx, &s3.GetObjectInput{
		Bucket: aws.String(c.bucket),
		Key:    aws.String(key),
	}, func(opts *s3.PresignOptions) { opts.Expires = expires })
	if err != nil {
		return "", err
	}
	return pre.URL, nil
}
