import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./user";

export const subscription = pgTable("subscription", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  dodoSubscriptionId: text("dodo_subscription_id").notNull().unique(),
  productId: text("product_id").notNull(),
  status: text("status").notNull(), // active | cancelled | expired | etc.
  currentPeriodEnd: timestamp("current_period_end"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});
