import { pgEnum, pgTable, text } from "drizzle-orm/pg-core";
import { organization } from "./organization";
import { user } from "./user";

export const memberRoleEnum = pgEnum("member_role", ["ADMIN", "STAFF"]);

export const member = pgTable("member", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  role: memberRoleEnum("role").notNull(),
});

