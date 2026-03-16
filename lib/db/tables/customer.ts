import { integer, pgTable, text } from "drizzle-orm/pg-core";
import { organization } from "./organization";

export const customer = pgTable("customer", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  name: text("name").notNull(),
  phone: text("phone"),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  totalBookings: integer("total_bookings").notNull().default(0),
  totalSpent: text("total_spent").notNull().default("0"),
  adminNotes: text("admin_notes"),
  tags: text("tags").array().notNull().default([]),
});

