CREATE TABLE "funnel" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"steps" jsonb NOT NULL,
	"created_at" timestamp NOT NULL
);
