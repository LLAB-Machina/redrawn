package schema

import (
	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
)

// CreditUsage logs when and why user credits are consumed.
type CreditUsage struct{ ent.Schema }

func (CreditUsage) Mixin() []ent.Mixin {
	return []ent.Mixin{
		TimestampMixin{},
	}
}

func (CreditUsage) Fields() []ent.Field {
	return []ent.Field{
		field.String("id").DefaultFunc(newID),
		field.Int64("amount").Default(1),
		field.String("reason").Default("generate"),
	}
}

func (CreditUsage) Edges() []ent.Edge {
	return []ent.Edge{
		edge.From("user", User.Type).Ref("credit_usages").Unique().Required(),
		edge.From("generated_photo", GeneratedPhoto.Type).Ref("credit_usages").Unique().Required(),
	}
}
