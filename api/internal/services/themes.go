package services

import (
	"context"

	"redrawn/api/ent"
	"redrawn/api/ent/theme"
	"redrawn/api/internal/api"
	"redrawn/api/internal/app"
)

type ThemesService struct{ app *app.App }

func NewThemesService(a *app.App) *ThemesService { return &ThemesService{app: a} }

func (s *ThemesService) List(ctx context.Context) ([]api.Theme, error) {
	items, err := s.app.Ent.Theme.Query().Order(ent.Asc(theme.FieldCreatedAt)).All(ctx)
	if err != nil {
		return nil, err
	}
	out := make([]api.Theme, 0, len(items))
	for _, t := range items {
		out = append(out, api.Theme{
			ID:     t.ID.String(),
			Name:   t.Name,
			Slug:   t.Slug,
			Prompt: t.Prompt,
		})
	}
	return out, nil
}

func (s *ThemesService) Create(ctx context.Context, name, prompt string, cssTokens map[string]any) (api.IDResponse, error) {
	t, err := s.app.Ent.Theme.Create().SetName(name).SetSlug(name).SetPrompt(prompt).SetCSSTokens(cssTokens).Save(ctx)
	if err != nil {
		return api.IDResponse{}, err
	}
	return api.IDResponse{ID: t.ID.String()}, nil
}
