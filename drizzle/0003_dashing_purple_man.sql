ALTER TABLE "organization" ADD COLUMN "payment_gateway" text;--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "razorpay_key_id" text;--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "razorpay_key_secret" text;--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "dodopay_client_id" text;--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "dodopay_client_secret" text;