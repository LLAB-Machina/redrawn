-- Modify "original_photos" table
ALTER TABLE "public"."original_photos" ADD COLUMN "captured_at" timestamptz NULL, ADD COLUMN "latitude" double precision NULL, ADD COLUMN "longitude" double precision NULL, ADD COLUMN "location_name" character varying NULL, ADD COLUMN "image_width" bigint NULL, ADD COLUMN "image_height" bigint NULL, ADD COLUMN "orientation" character varying NULL;
