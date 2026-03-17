import type { InferSelectModel } from "drizzle-orm";
import { booking } from "@/lib/db/schema";

export type BookingRow = InferSelectModel<typeof booking>;

export type BookingStatus = BookingRow["status"];

export type BookingCalendarEventDto = {
  id: string;
  title: string;
  start: string;
  end: string;
  status: BookingStatus;
  staffName: string | null;
  serviceName: string | null;
  customerName: string | null;
  paymentStatus: BookingRow["paymentStatus"];
};

