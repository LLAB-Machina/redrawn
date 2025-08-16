package schema

import (
	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
)

// AlbumPassword stores per-role password hashes for an album
type AlbumPassword struct{ ent.Schema }

func (AlbumPassword) Mixin() []ent.Mixin {
	return []ent.Mixin{
		TimestampMixin{},
	}
}

func (AlbumPassword) Fields() []ent.Field {
	return []ent.Field{
		field.String("id").DefaultFunc(newID),
		field.Enum("role").Values(RoleValues...).Default(RoleViewer),
		field.String("password_hash").NotEmpty(),
		field.Time("revoked_at").Optional().Nillable(),
	}
}

func (AlbumPassword) Edges() []ent.Edge {
	return []ent.Edge{
		edge.From("album", Album.Type).Ref("passwords").Unique().Required(),
	}
}

func (AlbumPassword) Indexes() []ent.Index {
	return []ent.Index{
		index.Edges("album").Fields("role").Unique(),
	}
}
