package schema

import (
	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
)

// AlbumInviteLink stores a shareable link that grants a role to anyone who accepts
type AlbumInviteLink struct{ ent.Schema }

func (AlbumInviteLink) Mixin() []ent.Mixin {
	return []ent.Mixin{
		TimestampMixin{},
	}
}

func (AlbumInviteLink) Fields() []ent.Field {
	return []ent.Field{
		field.String("id").DefaultFunc(newID),
		field.String("token").Unique(),
		field.Enum("role").Values(RoleValues...).Default(RoleViewer),
		field.Int("max_uses").Optional().Nillable(),
		field.Int("uses").Default(0),
		field.Time("expires_at").Optional().Nillable(),
		field.Time("revoked_at").Optional().Nillable(),
	}
}

func (AlbumInviteLink) Edges() []ent.Edge {
	return []ent.Edge{
		edge.From("album", Album.Type).Ref("invite_links").Unique().Required(),
		edge.From("created_by", User.Type).Ref("created_invite_links").Unique().Required(),
		// Optional revoked_by edge if tracking user who revoked
		edge.From("revoked_by", User.Type).Ref("revoked_invite_links").Unique(),
	}
}

func (AlbumInviteLink) Indexes() []ent.Index {
	return []ent.Index{
		index.Edges("album"),
		index.Edges("created_by"),
	}
}
