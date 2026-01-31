package handlers

import (
	"github.com/go-fuego/fuego"
	"redrawn/internal/app"
	"redrawn/internal/services"
)

// AuthHandler handles authentication routes
type AuthHandler struct {
	app *app.App
}

// NewAuthHandler creates a new AuthHandler
func NewAuthHandler(a *app.App) *AuthHandler {
	return &AuthHandler{app: a}
}

// RegisterRoutes registers auth routes
func (h *AuthHandler) RegisterRoutes(s *fuego.Server) {
	fuego.Post(s, "/auth/login", h.Login,
		fuego.OptionTags("Auth"),
		fuego.OptionOperationID("login"),
		fuego.OptionDescription("Login with email and password"),
	)

	fuego.Post(s, "/auth/register", h.Register,
		fuego.OptionTags("Auth"),
		fuego.OptionOperationID("register"),
		fuego.OptionDescription("Register a new user"),
	)
}

// LoginRequest represents a login request
type LoginRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required"`
}

// LoginResponse represents a login response
type LoginResponse struct {
	Token string         `json:"token"`
	User  services.User `json:"user"`
}

// Login handles user login
func (h *AuthHandler) Login(c *fuego.ContextWithBody[LoginRequest]) (LoginResponse, error) {
	input, err := c.Body()
	if err != nil {
		return LoginResponse{}, err
	}

	resp, err := h.app.AuthService.Login(c.Context(), services.LoginInput{
		Email:    input.Email,
		Password: input.Password,
	})
	if err != nil {
		return LoginResponse{}, err
	}

	return LoginResponse{
		Token: resp.Token,
		User:  *resp.User,
	}, nil
}

// RegisterRequest represents a registration request
type RegisterRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Name     string `json:"name"`
	Password string `json:"password" validate:"required,min=8"`
}

// RegisterResponse represents a registration response
type RegisterResponse struct {
	Token string         `json:"token"`
	User  services.User `json:"user"`
}

// Register handles user registration
func (h *AuthHandler) Register(c *fuego.ContextWithBody[RegisterRequest]) (RegisterResponse, error) {
	input, err := c.Body()
	if err != nil {
		return RegisterResponse{}, err
	}

	user, err := h.app.UserService.Create(c.Context(), services.CreateUserInput{
		Email:    input.Email,
		Name:     input.Name,
		Password: input.Password,
	})
	if err != nil {
		return RegisterResponse{}, err
	}

	// Generate token for the new user
	loginResp, err := h.app.AuthService.Login(c.Context(), services.LoginInput{
		Email:    input.Email,
		Password: input.Password,
	})
	if err != nil {
		return RegisterResponse{}, err
	}

	return RegisterResponse{
		Token: loginResp.Token,
		User:  *user,
	}, nil
}
