-- Create "album_invite_links" table
CREATE TABLE "public"."album_invite_links" (
  "id" uuid NOT NULL,
  "token" character varying NOT NULL,
  "role" character varying NOT NULL DEFAULT 'viewer',
  "max_uses" bigint NULL,
  "uses" bigint NOT NULL DEFAULT 0,
  "expires_at" timestamptz NULL,
  "revoked_at" timestamptz NULL,
  "created_at" timestamptz NOT NULL,
  "album_invite_links" uuid NOT NULL,
  "user_created_invite_links" uuid NOT NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "album_invite_links_albums_invite_links" FOREIGN KEY ("album_invite_links") REFERENCES "public"."albums" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT "album_invite_links_users_created_invite_links" FOREIGN KEY ("user_created_invite_links") REFERENCES "public"."users" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
);
-- Create index "album_invite_links_token_key" to table: "album_invite_links"
CREATE UNIQUE INDEX "album_invite_links_token_key" ON "public"."album_invite_links" ("token");
-- Create "album_invites" table
CREATE TABLE "public"."album_invites" (
  "id" uuid NOT NULL,
  "email" character varying NOT NULL,
  "role" character varying NOT NULL DEFAULT 'viewer',
  "status" character varying NOT NULL DEFAULT 'pending',
  "token" character varying NOT NULL,
  "expires_at" timestamptz NULL,
  "created_at" timestamptz NOT NULL,
  "updated_at" timestamptz NOT NULL,
  "revoked_at" timestamptz NULL,
  "accepted_at" timestamptz NULL,
  "album_email_invites" uuid NOT NULL,
  "album_invite_accepted_by" uuid NULL,
  "user_created_email_invites" uuid NOT NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "album_invites_albums_email_invites" FOREIGN KEY ("album_email_invites") REFERENCES "public"."albums" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT "album_invites_users_accepted_by" FOREIGN KEY ("album_invite_accepted_by") REFERENCES "public"."users" ("id") ON UPDATE NO ACTION ON DELETE SET NULL,
  CONSTRAINT "album_invites_users_created_email_invites" FOREIGN KEY ("user_created_email_invites") REFERENCES "public"."users" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
);
-- Create index "album_invites_token_key" to table: "album_invites"
CREATE UNIQUE INDEX "album_invites_token_key" ON "public"."album_invites" ("token");
