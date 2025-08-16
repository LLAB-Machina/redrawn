package schema

import (
	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
)

type User struct{ ent.Schema }

func (User) Mixin() []ent.Mixin {
	return []ent.Mixin{
		TimestampMixin{},
	}
}

func (User) Fields() []ent.Field {
	return []ent.Field{
		field.String("id").DefaultFunc(newID),
		field.String("email").Unique(),
		field.String("name").Optional(),
		field.String("stripe_customer_id").Optional(),
		field.String("plan").Default("free"),
		field.Int64("credits").Default(0),
	}
}

func (User) Edges() []ent.Edge {
	return []ent.Edge{
		edge.To("albums", Album.Type),
		edge.To("memberships", AlbumUser.Type),
		edge.To("created_invite_links", AlbumInviteLink.Type),
		edge.To("revoked_invite_links", AlbumInviteLink.Type),
		edge.To("created_email_invites", AlbumInvite.Type),
		edge.To("uploaded_photos", OriginalPhoto.Type),
		edge.To("themes", Theme.Type),
		edge.To("purchases", Purchase.Type),
		edge.To("credit_usages", CreditUsage.Type),
	}
}
