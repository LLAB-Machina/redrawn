package schema

import (
	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
)

type File struct{ ent.Schema }

func (File) Mixin() []ent.Mixin {
	return []ent.Mixin{
		TimestampMixin{},
	}
}

func (File) Fields() []ent.Field {
	return []ent.Field{
		field.String("id").DefaultFunc(newID),
		field.String("provider").Default("r2"),
		field.String("provider_key").Optional(),
		field.String("original_name").Optional(),
		field.String("mime_type").Optional(),
		field.Int64("size_bytes").Default(0),
	}
}

func (File) Indexes() []ent.Index {
	return []ent.Index{
		index.Fields("provider", "provider_key").Unique(),
	}
}

func (File) Edges() []ent.Edge {
	return []ent.Edge{
		edge.To("original_of", OriginalPhoto.Type),
		edge.To("generated_of", GeneratedPhoto.Type),
	}
}
