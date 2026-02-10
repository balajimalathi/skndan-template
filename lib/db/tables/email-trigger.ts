import { pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";

export const emailTrigger = pgTable("email_trigger", {
  id: text("id").primaryKey(),
  triggerEvent: text("trigger_event").notNull(),
  name: text("name").notNull(),
  subject: text("subject").notNull(),
  bodyHtml: text("body_html").notNull(),
  enabled: boolean("enabled").notNull().default(true),
  createdAt: timestamp("created_at").notNull(),
});
