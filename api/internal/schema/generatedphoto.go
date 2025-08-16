package schema

import (
	"time"

	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
)

type GeneratedPhoto struct{ ent.Schema }

func (GeneratedPhoto) Mixin() []ent.Mixin {
	return []ent.Mixin{
		TimestampMixin{},
		SoftDeleteMixin{},
	}
}

func (GeneratedPhoto) Fields() []ent.Field {
	return []ent.Field{
		field.String("id").DefaultFunc(newID),
		field.Enum("status").Values(GeneratedStatusValues...).Default(GeneratedStatusQueued),
		field.Time("started_at").Default(time.Now),
		field.Time("finished_at").Optional().Nillable(),
		field.String("error_message").Optional().Nillable(),
	}
}

func (GeneratedPhoto) Edges() []ent.Edge {
	return []ent.Edge{
		edge.From("original_photo", OriginalPhoto.Type).Ref("generated").Unique().Required(),
		edge.From("theme", Theme.Type).Ref("generated").Unique().Required(),
		edge.From("file", File.Type).Ref("generated_of").Unique(),
		edge.To("credit_usages", CreditUsage.Type),
	}
}
