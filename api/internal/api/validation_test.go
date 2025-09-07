package api

import "testing"

type sampleReq struct {
	Email string `json:"email" validate:"required,email"`
}

func TestValidateStructSuccess(t *testing.T) {
	err := ValidateStruct(sampleReq{Email: "user@example.com"})
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
}

func TestValidateStructFailure(t *testing.T) {
	err := ValidateStruct(sampleReq{Email: ""})
	if err == nil {
		t.Fatalf("expected error, got nil")
	}
	if _, ok := err.(ErrValidation); !ok {
		t.Fatalf("expected ErrValidation, got %T", err)
	}
}
