import {
  decimal,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { organization } from "./organization";
import { service } from "./service";
import { staff } from "./staff";

export const bookingStatusEnum = pgEnum("booking_status", [
  "PENDING",
  "CONFIRMED",
  "CANCELLED",
  "COMPLETED",
  "NO_SHOW",
]);

export const paymentGatewayEnum = pgEnum("payment_gateway", [
  "RAZORPAY",
  "DODOPAYMENTS",
  "FREE",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "PENDING",
  "PAID",
  "REFUNDED",
  "FAILED",
]);

export const booking = pgTable("booking", {
  id: text("id").primaryKey(),
  reference: text("reference").notNull().unique(),
  serviceId: text("service_id")
    .notNull()
    .references(() => service.id, { onDelete: "restrict" }),
  staffId: text("staff_id")
    .notNull()
    .references(() => staff.id, { onDelete: "restrict" }),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  status: bookingStatusEnum("status").notNull().default("PENDING"),
  paymentGateway: paymentGatewayEnum("payment_gateway").notNull(),
  paymentId: text("payment_id"),
  paymentStatus: paymentStatusEnum("payment_status").notNull().default("PENDING"),
  amountPaid: decimal("amount_paid", { precision: 10, scale: 2 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull(),
});

