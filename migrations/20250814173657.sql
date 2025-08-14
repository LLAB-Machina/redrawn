-- Create "prices" table
CREATE TABLE "public"."prices" (
  "id" uuid NOT NULL,
  "name" character varying NOT NULL,
  "stripe_price_id" character varying NOT NULL,
  "credits" bigint NOT NULL DEFAULT 1,
  "active" boolean NOT NULL DEFAULT true,
  "created_at" timestamptz NOT NULL,
  PRIMARY KEY ("id")
);
-- Create index "prices_stripe_price_id_key" to table: "prices"
CREATE UNIQUE INDEX "prices_stripe_price_id_key" ON "public"."prices" ("stripe_price_id");
