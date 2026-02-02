package services

import (
	"context"
	"fmt"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/aws-sdk-go-v2/service/s3/types"
)

// StorageService handles S3-compatible storage operations
type StorageService struct {
	client   *s3.Client
	bucket   string
	endpoint string
	useSSL   bool
}

// NewStorageService creates a new StorageService
func NewStorageService(endpoint, accessKey, secretKey, bucket string, useSSL bool) (*StorageService, error) {
	// Create custom resolver for S3-compatible storage (MinIO, R2, etc.)
	resolver := aws.EndpointResolverWithOptionsFunc(func(service, region string, options ...interface{}) (aws.Endpoint, error) {
		scheme := "http"
		if useSSL {
			scheme = "https"
		}
		return aws.Endpoint{
			URL:               fmt.Sprintf("%s://%s", scheme, endpoint),
			HostnameImmutable: true,
			Source:            aws.EndpointSourceCustom,
		}, nil
	})

	cfg, err := config.LoadDefaultConfig(context.Background(),
		config.WithRegion("auto"),
		config.WithEndpointResolverWithOptions(resolver),
		config.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(accessKey, secretKey, "")),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to load AWS config: %w", err)
	}

	client := s3.NewFromConfig(cfg, func(o *s3.Options) {
		o.UsePathStyle = true // Required for MinIO
	})

	return &StorageService{
		client:   client,
		bucket:   bucket,
		endpoint: endpoint,
		useSSL:   useSSL,
	}, nil
}

// UploadURLRequest holds data for generating an upload URL
type UploadURLRequest struct {
	Filename string `json:"filename" validate:"required"`
	MimeType string `json:"mime_type" validate:"required"`
	Size     int64  `json:"size" validate:"required,min=1,max=104857600"` // Max 100MB
}

// UploadURLResponse holds the generated upload URL
type UploadURLResponse struct {
	UploadURL string `json:"upload_url"`
	StorageKey string `json:"storage_key"`
	ExpiresAt int64  `json:"expires_at"` // Unix timestamp
}

// GenerateUploadURL creates a presigned URL for direct upload to S3
func (s *StorageService) GenerateUploadURL(ctx context.Context, req UploadURLRequest) (*UploadURLResponse, error) {
	// Generate unique storage key
	storageKey := fmt.Sprintf("uploads/%d-%s", time.Now().Unix(), req.Filename)

	// Create presigned URL for PUT
	presignClient := s3.NewPresignClient(s.client)
	
	putInput := &s3.PutObjectInput{
		Bucket:      aws.String(s.bucket),
		Key:         aws.String(storageKey),
		ContentType: aws.String(req.MimeType),
	}

	// Set content length if provided
	if req.Size > 0 {
		putInput.ContentLength = aws.Int64(req.Size)
	}

	presignedReq, err := presignClient.PresignPutObject(ctx, putInput,
		s3.WithPresignExpires(15*time.Minute),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create presigned URL: %w", err)
	}

	return &UploadURLResponse{
		UploadURL:  presignedReq.URL,
		StorageKey: storageKey,
		ExpiresAt:  time.Now().Add(15 * time.Minute).Unix(),
	}, nil
}

// DownloadURLResponse holds the generated download URL
type DownloadURLResponse struct {
	DownloadURL string `json:"download_url"`
	ExpiresAt   int64  `json:"expires_at"` // Unix timestamp
}

// GenerateDownloadURL creates a presigned URL for downloading from S3
func (s *StorageService) GenerateDownloadURL(ctx context.Context, storageKey string) (*DownloadURLResponse, error) {
	presignClient := s3.NewPresignClient(s.client)

	getInput := &s3.GetObjectInput{
		Bucket: aws.String(s.bucket),
		Key:    aws.String(storageKey),
	}

	presignedReq, err := presignClient.PresignGetObject(ctx, getInput,
		s3.WithPresignExpires(1*time.Hour),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create presigned URL: %w", err)
	}

	return &DownloadURLResponse{
		DownloadURL: presignedReq.URL,
		ExpiresAt:   time.Now().Add(1 * time.Hour).Unix(),
	}, nil
}

// DeleteObject deletes an object from S3
func (s *StorageService) DeleteObject(ctx context.Context, storageKey string) error {
	_, err := s.client.DeleteObject(ctx, &s3.DeleteObjectInput{
		Bucket: aws.String(s.bucket),
		Key:    aws.String(storageKey),
	})
	if err != nil {
		return fmt.Errorf("failed to delete object: %w", err)
	}

	return nil
}

// EnsureBucket creates the bucket if it doesn't exist
func (s *StorageService) EnsureBucket(ctx context.Context) error {
	// Check if bucket exists
	_, err := s.client.HeadBucket(ctx, &s3.HeadBucketInput{
		Bucket: aws.String(s.bucket),
	})
	if err == nil {
		return nil // Bucket exists
	}

	// Create bucket
	_, err = s.client.CreateBucket(ctx, &s3.CreateBucketInput{
		Bucket: aws.String(s.bucket),
		CreateBucketConfiguration: &types.CreateBucketConfiguration{
			LocationConstraint: types.BucketLocationConstraintEuWest1,
		},
	})
	if err != nil {
		return fmt.Errorf("failed to create bucket: %w", err)
	}

	// Set bucket policy for public read (optional - for generated photos)
	policy := fmt.Sprintf(`{
		"Version": "2012-10-17",
		"Statement": [
			{
				"Effect": "Allow",
				"Principal": "*",
				"Action": ["s3:GetObject"],
				"Resource": ["arn:aws:s3:::%s/*"]
			}
		]
	}`, s.bucket)

	_, err = s.client.PutBucketPolicy(ctx, &s3.PutBucketPolicyInput{
		Bucket: aws.String(s.bucket),
		Policy: aws.String(policy),
	})
	if err != nil {
		// Non-fatal - bucket is created even if policy fails
		return nil
	}

	return nil
}

// GetPublicURL returns a public URL for an object (if bucket is public)
func (s *StorageService) GetPublicURL(storageKey string) string {
	scheme := "http"
	if s.useSSL {
		scheme = "https"
	}
	return fmt.Sprintf("%s://%s/%s/%s", scheme, s.endpoint, s.bucket, storageKey)
}
