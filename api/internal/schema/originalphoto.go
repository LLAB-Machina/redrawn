package schema

import (
	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
)

type OriginalPhoto struct{ ent.Schema }

func (OriginalPhoto) Mixin() []ent.Mixin {
	return []ent.Mixin{
		TimestampMixin{},
		SoftDeleteMixin{},
	}
}

func (OriginalPhoto) Fields() []ent.Field {
	return []ent.Field{
		field.String("id").DefaultFunc(newID),
		// EXIF metadata - Location & Time
		field.Time("captured_at").Optional().Nillable(),
		field.Float("latitude").Optional().Nillable(),
		field.Float("longitude").Optional().Nillable(),
		field.String("location_name").Optional().Nillable(),
		// Image Properties
		field.Int("image_width").Optional().Nillable(),
		field.Int("image_height").Optional().Nillable(),
		field.String("orientation").Optional().Nillable(),
	}
}

func (OriginalPhoto) Edges() []ent.Edge {
	return []ent.Edge{
		edge.From("album", Album.Type).Ref("original_photos").Unique().Required(),
		edge.From("file", File.Type).Ref("original_of").Unique().Required(),
		edge.From("uploaded_by", User.Type).Ref("uploaded_photos").Unique().Required(),
		edge.To("generated", GeneratedPhoto.Type),
		edge.To("credit_usages", CreditUsage.Type),
	}
}
