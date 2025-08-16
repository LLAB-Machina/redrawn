package schema

import (
	"context"
	"time"

	"entgo.io/ent"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/mixin"
)

// TimestampMixin adds created_at and updated_at fields and hooks to auto-manage them.
type TimestampMixin struct{ mixin.Schema }

func (TimestampMixin) Fields() []ent.Field {
	return []ent.Field{
		field.Time("created_at"),
		field.Time("updated_at"),
	}
}

func (TimestampMixin) Hooks() []ent.Hook {
	return []ent.Hook{
		// Auto-manage created_at and updated_at.
		func(next ent.Mutator) ent.Mutator {
			return ent.MutateFunc(func(ctx context.Context, m ent.Mutation) (ent.Value, error) {
				now := time.Now()
				switch m.Op() {
				case ent.OpCreate:
					// Set created_at if not set.
					if g, ok := m.(interface{ CreatedAt() (time.Time, bool) }); ok {
						if _, exists := g.CreatedAt(); !exists {
							if s, ok := m.(interface{ SetCreatedAt(time.Time) }); ok {
								s.SetCreatedAt(now)
							}
						}
					} else if s, ok := m.(interface{ SetCreatedAt(time.Time) }); ok {
						// If getter is not available, still try to set.
						s.SetCreatedAt(now)
					}
					// Always set updated_at on create as well.
					if s, ok := m.(interface{ SetUpdatedAt(time.Time) }); ok {
						s.SetUpdatedAt(now)
					}
				case ent.OpUpdate, ent.OpUpdateOne:
					if s, ok := m.(interface{ SetUpdatedAt(time.Time) }); ok {
						s.SetUpdatedAt(now)
					}
				}
				return next.Mutate(ctx, m)
			})
		},
	}
}

// SoftDeleteMixin adds a nullable deleted_at column for soft-deletes.
type SoftDeleteMixin struct{ mixin.Schema }

func (SoftDeleteMixin) Fields() []ent.Field {
	return []ent.Field{
		field.Time("deleted_at").Optional().Nillable(),
	}
}
