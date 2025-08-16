package schema

import (
	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
)

type AlbumUser struct{ ent.Schema }

func (AlbumUser) Mixin() []ent.Mixin {
	return []ent.Mixin{
		TimestampMixin{},
	}
}

func (AlbumUser) Fields() []ent.Field {
	return []ent.Field{
		field.Enum("role").Values(RoleValues...).Default(RoleViewer),
	}
}

func (AlbumUser) Edges() []ent.Edge {
	return []ent.Edge{
		edge.From("album", Album.Type).Ref("members").Unique().Required(),
		edge.From("user", User.Type).Ref("memberships").Unique().Required(),
	}
}

func (AlbumUser) Indexes() []ent.Index {
	return []ent.Index{
		index.Edges("album").Edges("user").Unique(),
	}
}
