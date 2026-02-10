import { pgTable, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { dashboard } from "./dashboard";

export type WidgetType = "funnel" | "retention" | "line_chart" | "table";

export type WidgetConfig = {
  funnelId?: string;
  startDate?: string;
  endDate?: string;
  cohortEvent?: string;
  returnEvent?: string;
  period?: "day" | "week";
  eventName?: string;
};

export type WidgetPosition = {
  x?: number;
  y?: number;
  w?: number;
  h?: number;
};

export const dashboardWidget = pgTable("dashboard_widget", {
  id: text("id").primaryKey(),
  dashboardId: text("dashboard_id")
    .notNull()
    .references(() => dashboard.id, { onDelete: "cascade" }),
  type: text("type").$type<WidgetType>().notNull(),
  config: jsonb("config").$type<WidgetConfig>(),
  position: jsonb("position").$type<WidgetPosition>(),
  createdAt: timestamp("created_at").notNull(),
});
