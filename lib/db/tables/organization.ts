import {
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const currencyEnum = pgEnum("currency", ["INR", "USD"]);

export const organization = pgTable("organization", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  logo: text("logo"),
  primaryColor: text("primary_color"),
  bookingHeadline: text("booking_headline"),
  timezone: text("timezone").notNull(),
  currency: currencyEnum("currency").notNull(),
  minAdvanceHours: integer("min_advance_hours").notNull(),
  maxAdvanceDays: integer("max_advance_days").notNull(),
  bufferMinutes: integer("buffer_minutes").notNull(),
  cancellationPolicyHours: integer("cancellation_policy_hours").notNull(),
  paymentGateway: text("payment_gateway"),
  razorpayKeyId: text("razorpay_key_id"),
  razorpayKeySecret: text("razorpay_key_secret"),
  dodopayClientId: text("dodopay_client_id"),
  dodopayClientSecret: text("dodopay_client_secret"),
  createdAt: timestamp("created_at").notNull(),
});

