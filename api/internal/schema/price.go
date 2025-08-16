package schema

import (
	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
)

// Price represents a purchasable Stripe price and the number of credits it grants
type Price struct{ ent.Schema }

func (Price) Mixin() []ent.Mixin {
	return []ent.Mixin{
		TimestampMixin{},
	}
}

func (Price) Fields() []ent.Field {
	return []ent.Field{
		field.String("id").DefaultFunc(newID),
		field.String("name").NotEmpty(),
		field.String("stripe_price_id").Unique().NotEmpty(),
		field.Int("credits").Default(1),
		field.Bool("active").Default(true),
		field.Int64("unit_amount").Optional(),
		field.String("currency").Optional(),
	}
}

func (Price) Edges() []ent.Edge {
	return []ent.Edge{
		edge.To("purchases", Purchase.Type),
	}
}
