package schema

import (
	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
)

// AlbumInvite represents a pending invite for a specific email to join an album
type AlbumInvite struct{ ent.Schema }

func (AlbumInvite) Mixin() []ent.Mixin {
	return []ent.Mixin{
		TimestampMixin{},
	}
}

func (AlbumInvite) Fields() []ent.Field {
	return []ent.Field{
		field.String("id").DefaultFunc(newID),
		field.String("email"),
		field.Enum("role").Values(RoleValues...).Default(RoleViewer),
		field.Enum("status").Values(InviteStatusValues...).Default(InviteStatusPending),
		field.String("token").Unique(),
		field.Time("expires_at").Optional().Nillable(),
		field.Time("revoked_at").Optional().Nillable(),
		field.Time("accepted_at").Optional().Nillable(),
	}
}

func (AlbumInvite) Edges() []ent.Edge {
	return []ent.Edge{
		edge.From("album", Album.Type).Ref("email_invites").Unique().Required(),
		edge.From("created_by", User.Type).Ref("created_email_invites").Unique().Required(),
		edge.To("accepted_by", User.Type).Unique(),
	}
}

// This index creates a composite index on the "album" edge (i.e., the album_id foreign key column) and the "status" field
// in the album_invite table. This allows efficient queries for invites by album and status (e.g., all pending invites for an album).
func (AlbumInvite) Indexes() []ent.Index {
	return []ent.Index{
		index.Edges("album").Fields("status"),
	}
}
