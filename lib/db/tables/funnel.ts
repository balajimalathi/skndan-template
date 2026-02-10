import { pgTable, text, timestamp, jsonb } from "drizzle-orm/pg-core";

export type FunnelStep = {
  event_name: string;
  filter?: Record<string, unknown>;
};

export const funnel = pgTable("funnel", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  steps: jsonb("steps").$type<FunnelStep[]>().notNull(),
  createdAt: timestamp("created_at").notNull(),
});
