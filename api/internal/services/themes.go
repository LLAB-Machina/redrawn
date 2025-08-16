package services

import (
	"context"

	"redrawn/api/internal/api"
	"redrawn/api/internal/app"
	"redrawn/api/internal/generated"
	"redrawn/api/internal/generated/theme"
)

type ThemesService struct{ app *app.App }

func NewThemesService(a *app.App) *ThemesService { return &ThemesService{app: a} }

func (s *ThemesService) List(ctx context.Context) ([]api.Theme, error) {
	items, err := s.app.Db.Theme.Query().Order(generated.Asc(theme.FieldCreatedAt)).All(ctx)
	if err != nil {
		return nil, err
	}
	out := make([]api.Theme, 0, len(items))
	for _, t := range items {
		out = append(out, api.Theme{
			ID:     t.ID,
			Name:   t.Name,
			Slug:   t.Slug,
			Prompt: t.Prompt,
		})
	}
	return out, nil
}

func (s *ThemesService) Create(ctx context.Context, name, prompt string) (api.IDResponse, error) {
	t, err := s.app.Db.Theme.Create().SetName(name).SetSlug(name).SetPrompt(prompt).Save(ctx)
	if err != nil {
		return api.IDResponse{}, err
	}
	return api.IDResponse{ID: t.ID}, nil
}
