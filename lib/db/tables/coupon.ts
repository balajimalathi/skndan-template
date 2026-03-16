import { integer, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { organization } from "./organization";

export const discountTypeEnum = pgEnum("discount_type", [
  "PERCENTAGE",
  "FIXED",
]);

export const coupon = pgTable("coupon", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),
  discountType: discountTypeEnum("discount_type").notNull(),
  discountValue: text("discount_value").notNull(),
  maxUses: integer("max_uses"),
  usedCount: integer("used_count").notNull().default(0),
  expiresAt: timestamp("expires_at"),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  serviceIds: text("service_ids").array().notNull().default([]),
});

