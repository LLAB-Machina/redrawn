package handlers

import (
	"redrawn/api/internal/api"

	"regexp"

	"github.com/go-fuego/fuego"
)

var (
	errUnauthorized = fuego.UnauthorizedError{Err: nil}
)

// BindAndValidate reads the JSON body into T and validates it with api.ValidateStruct.
// Returns the parsed body or an error (which the global serializer will format).
func BindAndValidate[T any](c fuego.ContextWithBody[T]) (T, error) {
	body, err := c.Body()
	if err != nil {
		var zero T
		return zero, err
	}
	if err := api.ValidateStruct(body); err != nil {
		var zero T
		return zero, err
	}
	return body, nil
}

// RequireUUIDParam fetches a path param and validates it as required UUID.
// It returns a validation error formatted for problem+json on failure.
func RequireUUIDParam(c interface{ PathParam(string) string }, name string) (string, error) {
	v := c.PathParam(name)
	if v == "" {
		return "", api.ErrValidation{Errors: []api.FieldError{{
			Field:  "path." + name,
			Reason: "is required",
			Tag:    "required",
		}}}
	}
	// Validate NanoID (URL-safe) of length 14
	if ok, _ := regexp.MatchString(`^[A-Za-z0-9_-]{14}$`, v); !ok {
		return "", api.ErrValidation{Errors: []api.FieldError{{
			Field:  "path." + name,
			Reason: "must be a valid id",
			Tag:    "nanoid",
		}}}
	}
	return v, nil
}
