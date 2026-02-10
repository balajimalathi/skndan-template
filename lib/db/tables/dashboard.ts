import { pgTable, text, timestamp, jsonb } from "drizzle-orm/pg-core";

export type DashboardLayout = {
  columns?: number;
  widgetIds?: string[];
};

export const dashboard = pgTable("dashboard", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  layout: jsonb("layout").$type<DashboardLayout>(),
  createdAt: timestamp("created_at").notNull(),
});
