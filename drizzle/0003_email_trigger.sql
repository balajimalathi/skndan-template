CREATE TABLE "email_trigger" (
	"id" text PRIMARY KEY NOT NULL,
	"trigger_event" text NOT NULL,
	"name" text NOT NULL,
	"subject" text NOT NULL,
	"body_html" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp NOT NULL
);
