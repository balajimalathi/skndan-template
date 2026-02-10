import { pgTable, text, timestamp, jsonb, primaryKey } from "drizzle-orm/pg-core";
import { user } from "./user";

export const userProperty = pgTable(
  "user_property",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    key: text("key").notNull(),
    value: jsonb("value").$type<unknown>(),
    updatedAt: timestamp("updated_at").notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.key] })]
);
