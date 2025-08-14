Validation and Problem+JSON

- Use `github.com/go-playground/validator/v10` for all request body validation.
- Request/response models live in `api/internal/api/models.go` and must declare `validate:"..."` tags.
- Call `api.ValidateStruct(body)` in every handler that parses a body before invoking services.
- Validation errors must return RFC 7807 `application/problem+json` with a 400 status. The global error serializer in `api/cmd/api/main.go` handles `api.ErrValidation` and formats a problem+json document with an `errors` array of field issues.
- For PATCH requests, use pointer fields in request structs to express optionality; still call `api.ValidateStruct` to enforce any present-field constraints.

References: `go-playground/validator` (`https://github.com/go-playground/validator`).
