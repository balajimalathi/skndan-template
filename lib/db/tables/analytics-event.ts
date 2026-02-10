import { pgTable, text, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { user } from "./user";

export const analyticsEvent = pgTable(
  "analytics_event",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    anonymousId: text("anonymous_id"),
    eventName: text("event_name").notNull(),
    properties: jsonb("properties").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at").notNull(),
  },
  (table) => [
    index("analytics_event_event_name_created_at_idx").on(
      table.eventName,
      table.createdAt
    ),
    index("analytics_event_user_id_created_at_idx").on(
      table.userId,
      table.createdAt
    ),
  ]
);
