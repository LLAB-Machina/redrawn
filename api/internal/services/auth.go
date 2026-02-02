package services

import (
	"context"
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

// AuthService handles authentication
type AuthService struct {
	userService *UserService
	jwtSecret   string
}

// NewAuthService creates a new AuthService
func NewAuthService(userService *UserService, jwtSecret string) *AuthService {
	return &AuthService{
		userService: userService,
		jwtSecret:   jwtSecret,
	}
}

// Claims represents JWT claims
type Claims struct {
	UserID string `json:"user_id"`
	Email  string `json:"email"`
	jwt.RegisteredClaims
}

// LoginInput holds login credentials
type LoginInput struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required"`
}

// LoginResponse holds the login response
type LoginResponse struct {
	Token string `json:"token"`
	User  *User  `json:"user"`
}

// Login authenticates a user and returns a JWT token
func (s *AuthService) Login(ctx context.Context, input LoginInput) (*LoginResponse, error) {
	// Get user with password hash
	userWithPassword, err := s.userService.GetByEmailWithPassword(ctx, input.Email)
	if err != nil {
		if errors.Is(err, errors.New("user not found")) {
			return nil, errors.New("invalid credentials")
		}
		return nil, err
	}

	// Verify password hash against stored hash
	if userWithPassword.PasswordHash == "" {
		return nil, errors.New("invalid credentials")
	}
	
	err = bcrypt.CompareHashAndPassword([]byte(userWithPassword.PasswordHash), []byte(input.Password))
	if err != nil {
		return nil, errors.New("invalid credentials")
	}

	// Generate JWT token
	user := &userWithPassword.User
	token, err := s.generateToken(user)
	if err != nil {
		return nil, err
	}

	return &LoginResponse{
		Token: token,
		User:  user,
	}, nil
}

// ValidateToken validates a JWT token and returns the claims
func (s *AuthService) ValidateToken(tokenString string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		return []byte(s.jwtSecret), nil
	})
	
	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(*Claims); ok && token.Valid {
		return claims, nil
	}

	return nil, errors.New("invalid token")
}

func (s *AuthService) generateToken(user *User) (string, error) {
	claims := Claims{
		UserID: user.ID,
		Email:  user.Email,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(s.jwtSecret))
}
