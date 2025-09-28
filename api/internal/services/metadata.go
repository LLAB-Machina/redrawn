package services

import (
	"context"
	"fmt"
	"io"
	"strconv"
	"time"

	"github.com/rwcarlsen/goexif/exif"
	"github.com/rwcarlsen/goexif/mknote"
)

type PhotoMetadata struct {
	CapturedAt   *time.Time
	Latitude     *float64
	Longitude    *float64
	LocationName *string
	ImageWidth   *int
	ImageHeight  *int
	Orientation  *string
}

type MetadataService struct{}

func NewMetadataService() *MetadataService {
	return &MetadataService{}
}

func (s *MetadataService) ExtractMetadata(ctx context.Context, imageReader io.Reader) (*PhotoMetadata, error) {
	exif.RegisterParsers(mknote.All...)

	x, err := exif.Decode(imageReader)
	if err != nil {
		return &PhotoMetadata{}, nil
	}

	metadata := &PhotoMetadata{}

	if dt, err := x.DateTime(); err == nil {
		metadata.CapturedAt = &dt
	}

	if lat, lon, err := x.LatLong(); err == nil {
		metadata.Latitude = &lat
		metadata.Longitude = &lon
	}

	if tag, err := x.Get(exif.PixelXDimension); err == nil {
		if width, err := tag.Int(0); err == nil {
			metadata.ImageWidth = &width
		}
	}
	if tag, err := x.Get(exif.PixelYDimension); err == nil {
		if height, err := tag.Int(0); err == nil {
			metadata.ImageHeight = &height
		}
	}

	if tag, err := x.Get(exif.Orientation); err == nil {
		if orientation, err := tag.Int(0); err == nil {
			orientationStr := strconv.Itoa(orientation)
			metadata.Orientation = &orientationStr
		}
	}

	return metadata, nil
}

func (s *MetadataService) FormatGPSCoordinate(lat, lon float64) string {
	latDir := "N"
	if lat < 0 {
		latDir = "S"
		lat = -lat
	}

	lonDir := "E"
	if lon < 0 {
		lonDir = "W"
		lon = -lon
	}

	return fmt.Sprintf("%.6f°%s, %.6f°%s", lat, latDir, lon, lonDir)
}

func (s *MetadataService) GetOrientationDescription(orientation string) string {
	switch orientation {
	case "1":
		return "Normal"
	case "2":
		return "Flipped horizontally"
	case "3":
		return "Rotated 180°"
	case "4":
		return "Flipped vertically"
	case "5":
		return "Rotated 90° CW, flipped horizontally"
	case "6":
		return "Rotated 90° CW"
	case "7":
		return "Rotated 90° CCW, flipped horizontally"
	case "8":
		return "Rotated 90° CCW"
	default:
		return "Unknown"
	}
}
