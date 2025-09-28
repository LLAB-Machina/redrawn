-- Modify "generated_photos" table
ALTER TABLE "public"."generated_photos" ADD COLUMN "is_favorite" boolean NOT NULL DEFAULT false;
