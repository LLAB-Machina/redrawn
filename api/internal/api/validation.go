package api

import (
	"github.com/go-playground/validator/v10"
)

// validatorInstance is a shared validator for request payloads.
var validatorInstance = validator.New()

// FieldError describes a single invalid field.
type FieldError struct {
	Field  string `json:"field"`
	Reason string `json:"reason"`
	Tag    string `json:"tag,omitempty"`
	Param  string `json:"param,omitempty"`
}

// ErrValidation represents a collection of validation errors.
type ErrValidation struct {
	Errors []FieldError `json:"errors"`
}

func (e ErrValidation) Error() string { return "validation failed" }

// ValidateStruct validates the provided struct using struct tags.
// It returns ErrValidation on validation issues, or nil if valid.
func ValidateStruct(v any) error {
	if err := validatorInstance.Struct(v); err != nil {
		if verrs, ok := err.(validator.ValidationErrors); ok {
			fieldErrors := make([]FieldError, 0, len(verrs))
			for _, fe := range verrs {
				fieldErrors = append(fieldErrors, FieldError{
					Field:  fe.Field(),
					Reason: fe.Error(),
					Tag:    fe.Tag(),
					Param:  fe.Param(),
				})
			}
			return ErrValidation{Errors: fieldErrors}
		}
		return err
	}
	return nil
}
