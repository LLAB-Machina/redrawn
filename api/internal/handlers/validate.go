package handlers

import (
	"redrawn/api/internal/api"

	"github.com/go-fuego/fuego"
	"github.com/google/uuid"
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
	if _, err := uuid.Parse(v); err != nil {
		return "", api.ErrValidation{Errors: []api.FieldError{{
			Field:  "path." + name,
			Reason: "must be a valid UUID",
			Tag:    "uuid4",
		}}}
	}
	return v, nil
}
