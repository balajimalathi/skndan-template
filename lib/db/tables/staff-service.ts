import { integer, pgTable, primaryKey, text } from "drizzle-orm/pg-core";
import { service } from "./service";
import { staff } from "./staff";

export const staffService = pgTable(
  "staff_service",
  {
    staffId: text("staff_id")
      .notNull()
      .references(() => staff.id, { onDelete: "cascade" }),
    serviceId: text("service_id")
      .notNull()
      .references(() => service.id, { onDelete: "cascade" }),
    order: integer("order"),
  },
  (table) => [primaryKey({ columns: [table.staffId, table.serviceId] })]
);

