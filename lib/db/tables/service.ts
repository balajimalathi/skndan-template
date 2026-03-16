import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { organization } from "./organization";

export const service = pgTable("service", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  duration: integer("duration_minutes").notNull(),
  price: text("price").notNull(),
  depositAmount: text("deposit_amount"),
  currency: text("currency").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull(),
});

