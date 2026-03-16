import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { organization } from "./organization";
import { staff } from "./staff";

export const blackoutDate = pgTable("blackout_date", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  staffId: text("staff_id").references(() => staff.id, { onDelete: "cascade" }),
  date: timestamp("date").notNull(),
  reason: text("reason"),
});

