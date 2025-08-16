package schema

import (
	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
)

// Purchase stores a record of a Stripe purchase that granted credits.
type Purchase struct{ ent.Schema }

func (Purchase) Mixin() []ent.Mixin {
	return []ent.Mixin{
		TimestampMixin{},
	}
}

func (Purchase) Fields() []ent.Field {
	return []ent.Field{
		field.String("id").DefaultFunc(newID),
		field.String("stripe_checkout_session_id").NotEmpty(),
		field.String("stripe_payment_intent_id").Optional(),
		field.String("stripe_customer_id").Optional(),
		field.Int64("amount_total").Optional(), // in smallest currency unit (e.g., cents)
		field.String("currency").Optional(),
		field.Int64("credits_granted").Default(0),
		field.Enum("status").
			Values(PurchaseStatusValues...).
			Default(PurchaseStatusRequiresPayment),
		field.Time("completed_at").Optional().Nillable(),
	}
}

func (Purchase) Edges() []ent.Edge {
	return []ent.Edge{
		edge.From("user", User.Type).Ref("purchases").Unique().Required(),
		edge.From("price", Price.Type).Ref("purchases").Unique(),
	}
}

func (Purchase) Indexes() []ent.Index {
	return []ent.Index{
		index.Fields("stripe_payment_intent_id").Unique(),
		// Optional: make checkout_session unique if business rules allow
		// index.Fields("stripe_checkout_session_id").Unique(),
	}
}
