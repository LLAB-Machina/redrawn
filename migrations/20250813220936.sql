-- Create "jobs" table
CREATE TABLE "public"."jobs" (
  "id" uuid NOT NULL,
  "type" character varying NOT NULL,
  "payload" jsonb NULL,
  "status" character varying NOT NULL DEFAULT 'queued',
  "error" character varying NULL,
  "enqueued_at" timestamptz NOT NULL,
  "started_at" timestamptz NULL,
  "completed_at" timestamptz NULL,
  PRIMARY KEY ("id")
);
