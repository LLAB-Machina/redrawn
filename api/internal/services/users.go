package services

import (
	"context"
	"database/sql"
	"errors"
	"time"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

// User represents a user in the system
type User struct {
	ID        string    `json:"id"`
	Email     string    `json:"email"`
	Name      string    `json:"name"`
	Status    string    `json:"status"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// CreateUserInput holds data for creating a user
type CreateUserInput struct {
	Email    string `json:"email" validate:"required,email"`
	Name     string `json:"name"`
	Password string `json:"password" validate:"required,min=8"`
}

// UserWithPassword holds user data with password hash
type UserWithPassword struct {
	User
	PasswordHash string
}

// UserService handles user business logic
type UserService struct {
	db *sql.DB
}

// NewUserService creates a new UserService
func NewUserService(db *sql.DB) *UserService {
	return &UserService{db: db}
}

// Create creates a new user
func (s *UserService) Create(ctx context.Context, input CreateUserInput) (*User, error) {
	// Check if email already exists
	var existingID string
	err := s.db.QueryRowContext(ctx,
		"SELECT id FROM users WHERE email = $1",
		input.Email,
	).Scan(&existingID)
	
	if err == nil {
		return nil, errors.New("email already exists")
	}
	if !errors.Is(err, sql.ErrNoRows) {
		return nil, err
	}

	// Hash password
	hash, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	// Create user
	user := &User{
		ID:        uuid.New().String(),
		Email:     input.Email,
		Name:      input.Name,
		Status:    "active",
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	_, err = s.db.ExecContext(ctx,
		`INSERT INTO users (id, email, name, status, password_hash, created_at, updated_at) 
		 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
		user.ID, user.Email, user.Name, user.Status, string(hash), user.CreatedAt, user.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	return user, nil
}

// GetByID retrieves a user by ID
func (s *UserService) GetByID(ctx context.Context, id string) (*User, error) {
	user := &User{}
	err := s.db.QueryRowContext(ctx,
		"SELECT id, email, name, status, created_at, updated_at FROM users WHERE id = $1",
		id,
	).Scan(&user.ID, &user.Email, &user.Name, &user.Status, &user.CreatedAt, &user.UpdatedAt)
	
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, errors.New("user not found")
		}
		return nil, err
	}

	return user, nil
}

// GetByEmail retrieves a user by email
func (s *UserService) GetByEmail(ctx context.Context, email string) (*User, error) {
	user := &User{}
	err := s.db.QueryRowContext(ctx,
		"SELECT id, email, name, status, created_at, updated_at FROM users WHERE email = $1",
		email,
	).Scan(&user.ID, &user.Email, &user.Name, &user.Status, &user.CreatedAt, &user.UpdatedAt)
	
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, errors.New("user not found")
		}
		return nil, err
	}

	return user, nil
}

// GetByEmailWithPassword retrieves a user with password hash for authentication
func (s *UserService) GetByEmailWithPassword(ctx context.Context, email string) (*UserWithPassword, error) {
	user := &UserWithPassword{}
	err := s.db.QueryRowContext(ctx,
		"SELECT id, email, name, status, password_hash, created_at, updated_at FROM users WHERE email = $1",
		email,
	).Scan(&user.ID, &user.Email, &user.Name, &user.Status, &user.PasswordHash, &user.CreatedAt, &user.UpdatedAt)
	
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, errors.New("user not found")
		}
		return nil, err
	}

	return user, nil
}
