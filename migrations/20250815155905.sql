-- Create "credit_usages" table
CREATE TABLE "public"."credit_usages" (
  "id" uuid NOT NULL,
  "amount" bigint NOT NULL DEFAULT 1,
  "reason" character varying NOT NULL DEFAULT 'generate',
  "created_at" timestamptz NOT NULL,
  "generated_photo_credit_usages" uuid NULL,
  "original_photo_credit_usages" uuid NULL,
  "theme_credit_usages" uuid NULL,
  "user_credit_usages" uuid NOT NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "credit_usages_generated_photos_credit_usages" FOREIGN KEY ("generated_photo_credit_usages") REFERENCES "public"."generated_photos" ("id") ON UPDATE NO ACTION ON DELETE SET NULL,
  CONSTRAINT "credit_usages_original_photos_credit_usages" FOREIGN KEY ("original_photo_credit_usages") REFERENCES "public"."original_photos" ("id") ON UPDATE NO ACTION ON DELETE SET NULL,
  CONSTRAINT "credit_usages_themes_credit_usages" FOREIGN KEY ("theme_credit_usages") REFERENCES "public"."themes" ("id") ON UPDATE NO ACTION ON DELETE SET NULL,
  CONSTRAINT "credit_usages_users_credit_usages" FOREIGN KEY ("user_credit_usages") REFERENCES "public"."users" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
);
-- Create "purchases" table
CREATE TABLE "public"."purchases" (
  "id" uuid NOT NULL,
  "stripe_checkout_session_id" character varying NOT NULL,
  "stripe_payment_intent_id" character varying NULL,
  "stripe_customer_id" character varying NULL,
  "amount_total" bigint NULL,
  "currency" character varying NULL,
  "credits_granted" bigint NOT NULL DEFAULT 0,
  "created_at" timestamptz NOT NULL,
  "price_purchases" uuid NULL,
  "user_purchases" uuid NOT NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "purchases_prices_purchases" FOREIGN KEY ("price_purchases") REFERENCES "public"."prices" ("id") ON UPDATE NO ACTION ON DELETE SET NULL,
  CONSTRAINT "purchases_users_purchases" FOREIGN KEY ("user_purchases") REFERENCES "public"."users" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
);
