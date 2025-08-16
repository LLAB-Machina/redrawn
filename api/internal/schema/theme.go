package schema

import (
	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
)

type Theme struct{ ent.Schema }

func (Theme) Mixin() []ent.Mixin {
	return []ent.Mixin{
		TimestampMixin{},
	}
}

func (Theme) Fields() []ent.Field {
	return []ent.Field{
		field.String("id").DefaultFunc(newID),
		field.String("name").NotEmpty(),
		field.String("slug").Unique().NotEmpty(),
		field.String("prompt").NotEmpty(),
	}
}

func (Theme) Edges() []ent.Edge {
	return []ent.Edge{
		edge.From("created_by", User.Type).Ref("themes").Unique(),
		edge.To("albums", Album.Type),
		edge.To("generated", GeneratedPhoto.Type),
		edge.To("credit_usages", CreditUsage.Type),
	}
}
