package schema

import (
	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
)

type Album struct{ ent.Schema }

func (Album) Mixin() []ent.Mixin {
	return []ent.Mixin{
		TimestampMixin{},
		SoftDeleteMixin{},
	}
}

func (Album) Fields() []ent.Field {
	return []ent.Field{
		field.String("id").DefaultFunc(newID),
		field.String("name"),
		field.String("slug").Unique(),
		field.String("description").Optional(),
		field.Enum("visibility").Values(VisibilityValues...).Default(VisibilityUnlisted),
		field.Enum("originals_visible_to").
			Values(
				OriginalsVisibleToValues...,
			).
			Default(OriginalsVisibleToViewers),
	}
}

func (Album) Edges() []ent.Edge {
	return []ent.Edge{
		// Created by user; belongs-to Album (FK on albums table)
		edge.From("created_by", User.Type).Ref("albums").Unique().Required(),
		// Default theme; belongs-to Album (FK on albums table)
		edge.From("default_theme", Theme.Type).Ref("albums").Unique(),
		edge.To("members", AlbumUser.Type),
		edge.To("original_photos", OriginalPhoto.Type),
		edge.To("invite_links", AlbumInviteLink.Type),
		edge.To("email_invites", AlbumInvite.Type),
		edge.To("passwords", AlbumPassword.Type),
	}
}
