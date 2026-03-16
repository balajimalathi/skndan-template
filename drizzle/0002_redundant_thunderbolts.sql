ALTER TABLE "public"."booking" ALTER COLUMN "payment_gateway" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."payment_gateway";--> statement-breakpoint
CREATE TYPE "public"."payment_gateway" AS ENUM('RAZORPAY', 'DODOPAYMENTS', 'FREE');--> statement-breakpoint
ALTER TABLE "public"."booking" ALTER COLUMN "payment_gateway" SET DATA TYPE "public"."payment_gateway" USING "payment_gateway"::"public"."payment_gateway";