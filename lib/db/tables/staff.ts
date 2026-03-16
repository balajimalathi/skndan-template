import { pgTable, text } from "drizzle-orm/pg-core";
import { organization } from "./organization";
import { user } from "./user";

export const staff = pgTable("staff", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  bio: text("bio"),
  slug: text("slug").notNull().unique(),
});

